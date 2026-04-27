# OAISS 后端架构设计 — Spring Boot + MySQL + Hyperledger Fabric

> **版本**: v2.0  
> **技术栈**: Spring Boot 3.2 / MySQL 8.0 / Hyperledger Fabric 2.5 / Fabric Gateway Java SDK  
> **设计模式**: 链上链下分层架构（链下业务 + 链上存证）

---

## 目录

1. [架构总览](#1-架构总览)
2. [项目结构](#2-项目结构)
3. [数据库设计](#3-数据库设计)
4. [Fabric 网络设计](#4-fabric-网络设计)
5. [链码设计](#5-链码设计)
6. [Java 调用 Fabric（SDK）](#6-java-调用-fabricsdk)
7. [上链策略](#7-上链策略)
8. [交易撮合逻辑](#8-交易撮合逻辑)
9. [数据一致性设计](#9-数据一致性设计)
10. [API 接口设计](#10-api-接口设计)
11. [初始化 SQL](#11-初始化-sql)
12. [部署与启动](#12-部署与启动)

---

## 1. 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                    Vue 3 前端 (SPA)                       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────┐
│              Spring Boot 3.2 (后端服务)                    │
│                                                          │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │ 用户模块  │ 碳核算模块│ 审核模块  │ 交易模块  │ 配置模块│ │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴───┬────┘ │
│       │          │          │          │         │       │
│  ┌────▼──────────▼──────────▼──────────▼─────────▼────┐ │
│  │              FabricService（区块链服务层）             │ │
│  │   - 碳排放报告上链      - 审核结果上链                 │ │
│  │   - 交易记录上链        - 链上数据查询                 │ │
│  └────────────────────────┬───────────────────────────┘ │
└───────────────────────────┼─────────────────────────────┘
                            │ gRPC
┌───────────────────────────▼─────────────────────────────┐
│                 Hyperledger Fabric 2.5                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Channel: carbonchannel                           │   │
│  │                                                   │   │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────────┐   │   │
│  │  │  Org1   │  │  Org2    │  │    Org3       │   │   │
│  │  │ 监管机构 │  │ 企业联盟  │  │   审核机构    │   │   │
│  │  │ peer0   │  │ peer0    │  │   peer0       │   │   │
│  │  └─────────┘  └──────────┘  └───────────────┘   │   │
│  │                                                   │   │
│  │  Chaincode: carboncc                              │   │
│  │  - EmissionReport 碳数据存证                       │   │
│  │  - AuditRecord    审核记录存证                     │   │
│  │  - Transaction    交易记录存证                     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 分层职责

| 层 | 职责 | 存储 |
|----|------|------|
| **业务层** (Spring Boot) | 用户管理、订单撮合、账户余额计算、业务校验 | MySQL |
| **区块链服务层** (FabricService) | 数据哈希上链、链上存证、链上查询、链码调用 | Fabric |
| **链码层** (Chaincode Go) | 数据不可篡改存储、哈希校验、防伪验证 | Fabric World State + 区块文件 |

---

## 2. 项目结构

```
oaiss-server/
├── pom.xml
├── src/main/java/com/oaiss/
│   ├── OaissApplication.java              # 启动类
│   │
│   ├── config/
│   │   ├── SecurityConfig.java            # Spring Security + JWT
│   │   ├── FabricConfig.java              # Fabric Gateway 连接配置
│   │   ├── RedisConfig.java               # Redis 配置
│   │   └── CorsConfig.java                # 跨域配置
│   │
│   ├── common/
│   │   ├── Result.java                    # 统一响应体
│   │   ├── BusinessException.java         # 业务异常
│   │   ├── GlobalExceptionHandler.java    # 全局异常处理
│   │   └── PageResult.java               # 分页响应
│   │
│   ├── security/
│   │   ├── JwtTokenProvider.java          # JWT 生成/验证
│   │   ├── JwtAuthenticationFilter.java   # JWT 过滤器
│   │   └── UserDetailsServiceImpl.java    # 用户细节服务
│   │
│   ├── module/
│   │   ├── user/                           # ── 用户模块 ──
│   │   │   ├── controller/UserController.java
│   │   │   ├── service/UserService.java
│   │   │   ├── service/impl/UserServiceImpl.java
│   │   │   ├── mapper/UserMapper.java
│   │   │   ├── entity/SysUser.java
│   │   │   ├── entity/EnterpriseAccount.java
│   │   │   ├── dto/UserCreateDTO.java
│   │   │   └── dto/LoginDTO.java
│   │   │
│   │   ├── carbon/                         # ── 碳核算模块 ──
│   │   │   ├── controller/CarbonController.java
│   │   │   ├── service/CarbonService.java
│   │   │   ├── service/impl/CarbonServiceImpl.java
│   │   │   ├── mapper/CarbonReportMapper.java
│   │   │   ├── entity/CarbonEmissionReport.java
│   │   │   └── dto/CarbonReportDTO.java
│   │   │
│   │   ├── audit/                          # ── 审核模块 ──
│   │   │   ├── controller/AuditController.java
│   │   │   ├── service/AuditService.java
│   │   │   ├── service/impl/AuditServiceImpl.java
│   │   │   ├── mapper/AuditRecordMapper.java
│   │   │   ├── entity/AuditRecord.java
│   │   │   └── dto/AuditDTO.java
│   │   │
│   │   ├── trading/                        # ── 交易模块 ──
│   │   │   ├── controller/TradingController.java
│   │   │   ├── service/TradingService.java
│   │   │   ├── service/impl/TradingServiceImpl.java
│   │   │   ├── service/MatchingEngine.java      # ★ 撮合引擎
│   │   │   ├── service/OrderBookService.java    # 订单簿管理
│   │   │   ├── mapper/TradingOrderMapper.java
│   │   │   ├── mapper/OrderBookMapper.java
│   │   │   ├── mapper/P2POrderMapper.java
│   │   │   ├── mapper/TxRecordMapper.java
│   │   │   ├── entity/TradingOrder.java
│   │   │   ├── entity/OrderBookEntry.java
│   │   │   ├── entity/P2POrder.java
│   │   │   ├── entity/TransactionRecord.java
│   │   │   └── dto/OrderDTO.java
│   │   │
│   │   └── config/                         # ── 系统配置模块 ──
│   │       ├── controller/ConfigController.java
│   │       ├── service/ConfigService.java
│   │       ├── mapper/SystemConfigMapper.java
│   │       └── entity/SystemConfig.java
│   │
│   ├── fabric/                             # ══ Fabric 区块链层 ══
│   │   ├── FabricService.java              # 区块链服务（统一入口）
│   │   ├── FabricGatewayProvider.java      # Gateway 连接管理
│   │   ├── chaincode/
│   │   │   ├── CarbonChaincodeClient.java  # 碳数据链码调用
│   │   │   ├── AuditChaincodeClient.java   # 审核记录链码调用
│   │   │   └── TradingChaincodeClient.java # 交易记录链码调用
│   │   ├── model/
│   │   │   ├── OnChainEmission.java        # 链上碳排放数据模型
│   │   │   ├── OnChainAudit.java           # 链上审核数据模型
│   │   │   └── OnChainTransaction.java     # 链上交易数据模型
│   │   └── util/
│   │       ├── HashUtil.java               # SHA256 / SM3 哈希工具
│   │       └── FabricEventUtil.java        # 链码事件监听
│   │
│   ├── scheduler/
│   │   └── ReconciliationJob.java          # 数据一致性对账定时任务
│   │
│   └── util/
│       ├── SpringContextUtil.java
│       └── JsonUtil.java
│
├── src/main/resources/
│   ├── application.yml                     # 主配置
│   ├── application-dev.yml                 # 开发环境
│   ├── application-prod.yml                # 生产环境
│   ├── fabric/
│   │   ├── connection-profile.json         # Fabric 连接配置
│   │   └── wallet/                         # 身份钱包（证书）
│   └── sql/
│       ├── schema.sql                      # 建表语句
│       └── seed.sql                        # 种子数据
│
├── fabric/                                 # ══ Fabric 网络配置 ══
│   ├── network.sh                          # 网络启动脚本
│   ├── docker-compose.yml                  # Fabric 容器编排
│   ├── organizations/
│   │   └── cryptogen/                      # 证书生成
│   │       ├── crypto-config-org1.yaml
│   │       ├── crypto-config-org2.yaml
│   │       └── crypto-config-org3.yaml
│   ├── configtx/
│   │   └── configtx.yaml                   # 通道配置
│   └── chaincode/
│       └── carboncc/                       # 链码源码
│           ├── go.mod
│           ├── carboncc.go                 # 主文件
│           ├── emission.go                 # 碳排放数据逻辑
│           ├── audit.go                    # 审核记录逻辑
│           └── trading.go                  # 交易记录逻辑
│
└── docker-compose.yml                      # 开发环境总编排
```

---

## 3. 数据库设计（MySQL — 链下业务数据）

### 3.1 ER 关系图

```
sys_users 1────N enterprise_accounts
sys_users 1────N audit_records
sys_users 1────N carbon_emission_reports
enterprise_accounts 1────N trading_orders
enterprise_accounts 1────N p2p_orders
carbon_emission_reports 1────1 audit_records
trading_orders 1────N blockchain_transactions
```

### 3.2 建表 SQL

```sql
-- ==========================================
-- 1. 系统用户表
-- ==========================================
CREATE TABLE sys_users (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(64)  NOT NULL UNIQUE,
  password_hash   VARCHAR(256) NOT NULL COMMENT 'bcrypt',
  display_name    VARCHAR(128) NOT NULL,
  phone           VARCHAR(32)  DEFAULT '',
  role            ENUM('enterprise','auditor','admin') NOT NULL,
  credit_score    INT          DEFAULT 800,
  credit_enabled  TINYINT(1)   DEFAULT 1,
  status          TINYINT(1)   DEFAULT 1,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 2. 企业账户表
-- ==========================================
CREATE TABLE enterprise_accounts (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  company_id      VARCHAR(16) NOT NULL UNIQUE COMMENT '企业编码 C-XXXX',
  company_name    VARCHAR(128) NOT NULL,
  enterprise_type ENUM('发电企业','电网企业') NOT NULL,
  dept_name       VARCHAR(128) DEFAULT '',
  dept_code       VARCHAR(32)  DEFAULT '',
  funds           DECIMAL(20,2) DEFAULT 1000000.00,
  frozen_funds    DECIMAL(20,2) DEFAULT 0.00,
  carbon_quota    DECIMAL(20,2) DEFAULT 50000.00,
  frozen_quota    DECIMAL(20,2) DEFAULT 0.00,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES sys_users(id),
  INDEX idx_company_id (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 3. 碳排放报告表（链下业务数据）
-- ==========================================
CREATE TABLE carbon_emission_reports (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  report_no         VARCHAR(32)  NOT NULL UNIQUE COMMENT 'RPT-YYYYMM-XXXX',
  company_id        VARCHAR(16)  NOT NULL,
  dept_name         VARCHAR(128) NOT NULL,
  dept_code         VARCHAR(32)  NOT NULL,
  enterprise_type   ENUM('发电企业','电网企业') NOT NULL,
  coal_heat_value   DECIMAL(12,2) NOT NULL,
  coal_consumption  DECIMAL(12,2) NOT NULL,
  oil_heat_value    DECIMAL(12,2) NOT NULL,
  oil_consumption   DECIMAL(12,2) NOT NULL,
  emission          DECIMAL(14,2) NOT NULL COMMENT '碳排放量 tCO2e',
  data_hash         VARCHAR(66)  DEFAULT '' COMMENT '报告数据SHA256哈希',
  uploader_code     VARCHAR(16)  NOT NULL,
  audit_status      ENUM('pending','approved','rejected') DEFAULT 'pending',
  signed            TINYINT(1)   DEFAULT 0,
  fabric_tx_id      VARCHAR(128) DEFAULT '' COMMENT 'Fabric链上交易ID',
  fabric_block_num  BIGINT       DEFAULT 0 COMMENT 'Fabric区块号',
  submit_time       DATETIME     DEFAULT NULL,
  created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company (company_id),
  INDEX idx_status (audit_status),
  INDEX idx_fabric_tx (fabric_tx_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 4. 审核记录表
-- ==========================================
CREATE TABLE audit_records (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  report_id         BIGINT NOT NULL,
  auditor_id        BIGINT NOT NULL,
  pollution_status  VARCHAR(32)  DEFAULT '',
  impact_assessment TEXT,
  emission_level    VARCHAR(16)  DEFAULT '',
  audit_password    VARCHAR(256) DEFAULT '',
  event_code        VARCHAR(32)  DEFAULT '',
  reject_reason     TEXT,
  audit_result      ENUM('approved','rejected') NOT NULL,
  fabric_tx_id      VARCHAR(128) DEFAULT '' COMMENT 'Fabric链上交易ID',
  fabric_block_num  BIGINT       DEFAULT 0,
  audit_time        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES carbon_emission_reports(id),
  FOREIGN KEY (auditor_id) REFERENCES sys_users(id),
  INDEX idx_report (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 5. 交易订单表
-- ==========================================
CREATE TABLE trading_orders (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id        VARCHAR(16) NOT NULL,
  side              ENUM('buy','sell') NOT NULL,
  price             DECIMAL(12,2) NOT NULL,
  original_quantity DECIMAL(14,2) NOT NULL,
  quantity          DECIMAL(14,2) NOT NULL COMMENT '剩余数量',
  filled_quantity   DECIMAL(14,2) DEFAULT 0.00,
  status            ENUM('pending','partial','completed','cancelled') DEFAULT 'pending',
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company (company_id),
  INDEX idx_side_price (side, price),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 6. 订单簿表（仅链下，高频变更）
-- ==========================================
CREATE TABLE order_book (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT NOT NULL,
  company_id  VARCHAR(16) NOT NULL,
  price       DECIMAL(12,2) NOT NULL,
  quantity    DECIMAL(14,2) NOT NULL,
  side        ENUM('buy','sell') NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES trading_orders(id) ON DELETE CASCADE,
  INDEX idx_side_price (side, price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 7. P2P 订单表
-- ==========================================
CREATE TABLE p2p_orders (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_no         VARCHAR(32) NOT NULL UNIQUE,
  buyer_id         VARCHAR(16) NOT NULL,
  seller_id        VARCHAR(16) NOT NULL,
  buyer_name       VARCHAR(128) NOT NULL,
  seller_name      VARCHAR(128) NOT NULL,
  carbon_quota     DECIMAL(14,2) NOT NULL,
  unit_price       DECIMAL(12,2) NOT NULL,
  total_amount     DECIMAL(16,2) NOT NULL,
  app_id           VARCHAR(64) DEFAULT '',
  callback_url     VARCHAR(512) DEFAULT '',
  certificate_path VARCHAR(256) DEFAULT '',
  public_key       TEXT,
  status           ENUM('pending','partial','completed','cancelled') DEFAULT 'pending',
  fabric_tx_id     VARCHAR(128) DEFAULT '',
  fabric_block_num BIGINT DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 8. 区块链交易记录表（链下镜像 + 链上存证）
-- ==========================================
CREATE TABLE blockchain_transactions (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  tx_hash       VARCHAR(66) NOT NULL UNIQUE COMMENT '交易哈希 0x...',
  block_hash    VARCHAR(66) NOT NULL,
  block_height  BIGINT NOT NULL,
  buy_order_id  BIGINT,
  sell_order_id BIGINT,
  buyer_id      VARCHAR(16) NOT NULL,
  seller_id     VARCHAR(16) NOT NULL,
  buyer_name    VARCHAR(128) NOT NULL,
  seller_name   VARCHAR(128) NOT NULL,
  price         DECIMAL(12,2) NOT NULL,
  quantity      DECIMAL(14,2) NOT NULL,
  total_amount  DECIMAL(16,2) NOT NULL,
  data_hash     VARCHAR(66) DEFAULT '' COMMENT '交易数据SHA256',
  status        VARCHAR(16) DEFAULT 'completed',
  fabric_tx_id  VARCHAR(128) DEFAULT '' COMMENT 'Fabric链上交易ID',
  is_on_chain   TINYINT(1) DEFAULT 0 COMMENT '是否已上链 0未 1已',
  tx_time       DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_buyer (buyer_id),
  INDEX idx_on_chain (is_on_chain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 9. 系统配置表
-- ==========================================
CREATE TABLE system_configs (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  config_key  VARCHAR(64) NOT NULL UNIQUE,
  config_name VARCHAR(128) NOT NULL,
  config_value TEXT NOT NULL,
  description VARCHAR(256) DEFAULT '',
  updated_by  VARCHAR(64) DEFAULT '',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 10. 数据一致性对账表
-- ==========================================
CREATE TABLE reconciliation_log (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  biz_type      VARCHAR(32) NOT NULL COMMENT '业务类型: emission/audit/trade/p2p',
  biz_id        BIGINT NOT NULL COMMENT '业务记录ID',
  mysql_hash    VARCHAR(66) NOT NULL,
  fabric_hash   VARCHAR(66) DEFAULT '',
  is_consistent TINYINT(1) DEFAULT 0,
  retry_count   INT DEFAULT 0,
  last_retry_at DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_biz (biz_type, biz_id),
  INDEX idx_inconsistent (is_consistent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. Fabric 网络设计

### 4.1 组织与节点

| 组织 | 角色 | 节点 | 说明 |
|------|------|------|------|
| **Org1 (RegulatorMSP)** | 监管机构（管理员） | peer0.regulator.oaiss.com | 拥有链码管理权限，可查询全部数据 |
| **Org2 (EnterpriseMSP)** | 企业联盟 | peer0.enterprise.oaiss.com | 提交碳排放报告、下交易订单 |
| **Org3 (AuditorMSP)** | 审核机构 | peer0.auditor.oaiss.com | 审核碳排放报告 |
| **Orderer** | 排序节点 | orderer.oaiss.com (Raft) | 交易排序出块 |

### 4.2 通道配置

```
通道名称: carbonchannel

成员组织: Org1, Org2, Org3
出块策略:
  - BatchSize: 10 transactions
  - BatchTimeout: 2s
  - 共识: Raft（3节点排序集群）

背书策略:
  - 碳排放报告上链: AND(Org2.member, Org3.member)  # 企业+审核员双重背书
  - 交易记录上链:   AND(Org1.member, Org2.member)  # 监管+企业双重背书
  - 数据查询:       OR(Org1.member, Org2.member, Org3.member)
```

### 4.3 configtx.yaml

```yaml
Organizations:
  - &RegulatorOrg
      Name: RegulatorMSP
      ID: RegulatorMSP
      MSPDir: organizations/peerOrganizations/regulator.oaiss.com/msp
      Policies:
          Readers: { Type: Signature, Rule: "OR('RegulatorMSP.admin')" }
          Writers: { Type: Signature, Rule: "OR('RegulatorMSP.admin')" }
          Admins:  { Type: Signature, Rule: "OR('RegulatorMSP.admin')" }

  - &EnterpriseOrg
      Name: EnterpriseMSP
      ID: EnterpriseMSP
      MSPDir: organizations/peerOrganizations/enterprise.oaiss.com/msp
      Policies:
          Readers: { Type: Signature, Rule: "OR('EnterpriseMSP.admin')" }
          Writers: { Type: Signature, Rule: "OR('EnterpriseMSP.admin')" }
          Admins:  { Type: Signature, Rule: "OR('EnterpriseMSP.admin')" }

  - &AuditorOrg
      Name: AuditorMSP
      ID: AuditorMSP
      MSPDir: organizations/peerOrganizations/auditor.oaiss.com/msp
      Policies:
          Readers: { Type: Signature, Rule: "OR('AuditorMSP.admin')" }
          Writers: { Type: Signature, Rule: "OR('AuditorMSP.admin')" }
          Admins:  { Type: Signature, Rule: "OR('AuditorMSP.admin')" }

Capabilities:
    Channel: &ChannelCapabilities
        V2_0: true
    Application: &ApplicationCapabilities
        V2_5: true

Application: &ApplicationDefaults
    Organizations:
    Policies:
        Readers:        { Type: ImplicitMeta, Rule: "ANY Readers" }
        Writers:        { Type: ImplicitMeta, Rule: "ANY Writers" }
        Admins:         { Type: ImplicitMeta, Rule: "MAJORITY Admins" }
        LifecycleEndorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"
        Endorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"
    Capabilities: *ApplicationCapabilities
```

### 4.4 connection-profile.json（Spring Boot 连接用）

```json
{
  "name": "oaiss-network",
  "version": "1.0.0",
  "client": {
    "organization": "Org2",
    "connection": {
      "timeout": {
        "peer": { "endorser": "300" },
        "orderer": "300"
      }
    }
  },
  "organizations": {
    "Org2": {
      "mspid": "EnterpriseMSP",
      "peers": ["peer0.enterprise.oaiss.com"]
    }
  },
  "peers": {
    "peer0.enterprise.oaiss.com": {
      "url": "grpcs://localhost:7051",
      "tlsCACerts": {
        "path": "crypto-config/peerOrganizations/enterprise.oaiss.com/tlsca/tlsca.enterprise.oaiss.com-cert.pem"
      },
      "grpcOptions": {
        "ssl-target-name-override": "peer0.enterprise.oaiss.com"
      }
    }
  },
  "channels": {
    "carbonchannel": {
      "peers": {
        "peer0.enterprise.oaiss.com": {}
      }
    }
  }
}
```

---

## 5. 链码设计（Fabric Chaincode — Go 语言）

### 5.1 链码结构

```
carboncc/
├── go.mod
├── carboncc.go         # 主入口 + Init/Invoke
├── emission.go         # 碳排放数据上链/查询
├── audit.go            # 审核记录上链/查询
├── trading.go          # 交易记录上链/查询
└── types.go            # 公共数据结构
```

### 5.2 链上数据结构 (types.go)

```go
package main

import "encoding/json"

// 碳排放报告（链上存证）
type EmissionRecord struct {
    ReportNo        string  `json:"reportNo"`
    CompanyID       string  `json:"companyId"`
    Emission        float64 `json:"emission"`
    CoalHeatValue   float64 `json:"coalHeatValue"`
    CoalConsumption float64 `json:"coalConsumption"`
    OilHeatValue    float64 `json:"oilHeatValue"`
    OilConsumption  float64 `json:"oilConsumption"`
    DataHash        string  `json:"dataHash"`       // 链下完整数据的SHA256
    Submitter       string  `json:"submitter"`
    SubmitTime      string  `json:"submitTime"`
    TxID            string  `json:"txId"`
}

// 审核记录（链上存证）
type AuditRecord struct {
    ReportNo        string `json:"reportNo"`
    AuditorID       string `json:"auditorId"`
    AuditResult     string `json:"auditResult"`    // "approved" | "rejected"
    PollutionStatus string `json:"pollutionStatus"`
    ImpactAssessment string `json:"impactAssessment"`
    EmissionLevel   string `json:"emissionLevel"`
    RejectReason    string `json:"rejectReason,omitempty"`
    DataHash        string `json:"dataHash"`
    AuditTime       string `json:"auditTime"`
    TxID            string `json:"txId"`
}

// 交易记录（链上存证）
type TradeRecord struct {
    TxHash         string  `json:"txHash"`
    BlockHash      string  `json:"blockHash"`
    BlockHeight    uint64  `json:"blockHeight"`
    BuyerID        string  `json:"buyerId"`
    SellerID       string  `json:"sellerId"`
    BuyerName      string  `json:"buyerName"`
    SellerName     string  `json:"sellerName"`
    Price          float64 `json:"price"`
    Quantity       float64 `json:"quantity"`
    TotalAmount    float64 `json:"totalAmount"`
    DataHash       string  `json:"dataHash"`
    TradeTime      string  `json:"tradeTime"`
    TxID           string  `json:"txId"`
}

func toJSON(v interface{}) (string, error) {
    b, err := json.Marshal(v)
    return string(b), err
}
```

### 5.3 链码主入口 (carboncc.go)

```go
package main

import (
    "fmt"
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
    contractapi.Contract
}

func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
    return nil
}

func main() {
    chaincode, err := contractapi.NewChaincode(&SmartContract{})
    if err != nil {
        fmt.Printf("Error creating carboncc: %s", err.Error())
        return
    }
    if err := chaincode.Start(); err != nil {
        fmt.Printf("Error starting carboncc: %s", err.Error())
    }
}
```

### 5.4 碳排放数据链码 (emission.go)

```go
package main

import (
    "fmt"
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// RecordEmission 将碳排放报告存证上链
// 调用时机: 审核员审核通过后
func (s *SmartContract) RecordEmission(
    ctx contractapi.TransactionContextInterface,
    reportNo string,
    companyID string,
    emission float64,
    coalHeatValue float64,
    coalConsumption float64,
    oilHeatValue float64,
    oilConsumption float64,
    dataHash string,
    submitter string,
    submitTime string,
) error {
    // 检查是否已存在（防重）
    existing, _ := ctx.GetStub().GetState(reportNo)
    if len(existing) > 0 {
        return fmt.Errorf("emission report %s already exists on chain", reportNo)
    }

    txID := ctx.GetStub().GetTxID()

    record := EmissionRecord{
        ReportNo:        reportNo,
        CompanyID:       companyID,
        Emission:        emission,
        CoalHeatValue:   coalHeatValue,
        CoalConsumption: coalConsumption,
        OilHeatValue:    oilHeatValue,
        OilConsumption:  oilConsumption,
        DataHash:        dataHash,
        Submitter:       submitter,
        SubmitTime:      submitTime,
        TxID:            txID,
    }

    recordJSON, err := toJSON(record)
    if err != nil {
        return fmt.Errorf("failed to marshal emission record: %v", err)
    }

    if err := ctx.GetStub().PutState(reportNo, []byte(recordJSON)); err != nil {
        return fmt.Errorf("failed to put emission record on chain: %v", err)
    }

    fmt.Printf("Emission %s recorded on chain (tx: %s)\n", reportNo, txID)
    return nil
}

// QueryEmission 查询链上碳排放存证
func (s *SmartContract) QueryEmission(
    ctx contractapi.TransactionContextInterface,
    reportNo string,
) (*EmissionRecord, error) {
    data, err := ctx.GetStub().GetState(reportNo)
    if err != nil {
        return nil, fmt.Errorf("failed to read emission: %v", err)
    }
    if len(data) == 0 {
        return nil, fmt.Errorf("emission report %s not found", reportNo)
    }

    var record EmissionRecord
    if err := json.Unmarshal(data, &record); err != nil {
        return nil, err
    }
    return &record, nil
}

// VerifyEmissionHash 验证链下数据与链上哈希是否一致（防篡改校验）
func (s *SmartContract) VerifyEmissionHash(
    ctx contractapi.TransactionContextInterface,
    reportNo string,
    providedHash string,
) (bool, error) {
    data, err := ctx.GetStub().GetState(reportNo)
    if err != nil || len(data) == 0 {
        return false, fmt.Errorf("emission not found on chain")
    }
    var record EmissionRecord
    json.Unmarshal(data, &record)
    return record.DataHash == providedHash, nil
}
```

### 5.5 审核记录链码 (audit.go)

```go
// RecordAudit 将审核结果存证上链
// 调用时机: 审核员审核通过或驳回后
func (s *SmartContract) RecordAudit(
    ctx contractapi.TransactionContextInterface,
    reportNo string,
    auditorID string,
    auditResult string,         // "approved" | "rejected"
    pollutionStatus string,
    impactAssessment string,
    emissionLevel string,
    rejectReason string,
    dataHash string,
    auditTime string,
) error {
    compositeKey := fmt.Sprintf("AUDIT_%s", reportNo)

    existing, _ := ctx.GetStub().GetState(compositeKey)
    if len(existing) > 0 {
        return fmt.Errorf("audit record for %s already exists", reportNo)
    }

    txID := ctx.GetStub().GetTxID()

    record := AuditRecord{
        ReportNo:         reportNo,
        AuditorID:        auditorID,
        AuditResult:      auditResult,
        PollutionStatus:  pollutionStatus,
        ImpactAssessment: impactAssessment,
        EmissionLevel:    emissionLevel,
        RejectReason:     rejectReason,
        DataHash:         dataHash,
        AuditTime:        auditTime,
        TxID:             txID,
    }

    recordJSON, _ := toJSON(record)
    return ctx.GetStub().PutState(compositeKey, []byte(recordJSON))
}
```

### 5.6 交易记录链码 (trading.go)

```go
// RecordTrade 将撮合成功的交易存证上链
// 调用时机: 撮合引擎完成一笔撮合后
func (s *SmartContract) RecordTrade(
    ctx contractapi.TransactionContextInterface,
    txHash string,
    blockHash string,
    blockHeight uint64,
    buyerID string,
    sellerID string,
    buyerName string,
    sellerName string,
    price float64,
    quantity float64,
    totalAmount float64,
    dataHash string,
    tradeTime string,
) error {
    existing, _ := ctx.GetStub().GetState(txHash)
    if len(existing) > 0 {
        return fmt.Errorf("trade %s already recorded on chain", txHash)
    }

    txID := ctx.GetStub().GetTxID()

    record := TradeRecord{
        TxHash:      txHash,
        BlockHash:   blockHash,
        BlockHeight: blockHeight,
        BuyerID:     buyerID,
        SellerID:    sellerID,
        BuyerName:   buyerName,
        SellerName:  sellerName,
        Price:       price,
        Quantity:    quantity,
        TotalAmount: totalAmount,
        DataHash:    dataHash,
        TradeTime:   tradeTime,
        TxID:        txID,
    }

    recordJSON, _ := toJSON(record)
    return ctx.GetStub().PutState(txHash, []byte(recordJSON))
}

// QueryTradeByHash 根据交易哈希查询链上交易记录
func (s *SmartContract) QueryTradeByHash(
    ctx contractapi.TransactionContextInterface,
    txHash string,
) (*TradeRecord, error) {
    data, err := ctx.GetStub().GetState(txHash)
    if err != nil || len(data) == 0 {
        return nil, fmt.Errorf("trade %s not found on chain", txHash)
    }
    var record TradeRecord
    json.Unmarshal(data, &record)
    return &record, nil
}

// QueryTradeHistory 查询某个企业的全部链上交易记录
func (s *SmartContract) QueryTradeHistory(
    ctx contractapi.TransactionContextInterface,
    companyID string,
) ([]*TradeRecord, error) {
    queryString := fmt.Sprintf(
        `{"selector":{"$or":[{"buyerId":"%s"},{"sellerId":"%s"}]}}`,
        companyID, companyID,
    )
    resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
    if err != nil {
        return nil, err
    }
    defer resultsIterator.Close()

    var records []*TradeRecord
    for resultsIterator.HasNext() {
        kv, err := resultsIterator.Next()
        if err != nil {
            return nil, err
        }
        var record TradeRecord
        json.Unmarshal(kv.Value, &record)
        records = append(records, &record)
    }
    return records, nil
}
```

---

## 6. Java 调用 Fabric（SDK）

### 6.1 FabricGatewayProvider.java

```java
package com.oaiss.fabric;

import io.grpc.Grpc;
import io.grpc.ManagedChannel;
import io.grpc.TlsChannelCredentials;
import org.hyperledger.fabric.client.*;
import org.hyperledger.fabric.client.identity.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.cert.X509Certificate;
import java.util.concurrent.TimeUnit;

@Component
public class FabricGatewayProvider {

    @Value("${fabric.msp-id}")
    private String mspId;

    @Value("${fabric.certificate-path}")
    private String certPath;

    @Value("${fabric.private-key-path}")
    private String privateKeyPath;

    @Value("${fabric.tls-cert-path}")
    private String tlsCertPath;

    @Value("${fabric.peer-endpoint}")
    private String peerEndpoint;

    @Value("${fabric.override-auth}")
    private String overrideAuth;

    @Value("${fabric.channel-name}")
    private String channelName;

    @Value("${fabric.chaincode-name}")
    private String chaincodeName;

    private Gateway gateway;
    private Network network;
    private Contract contract;
    private ManagedChannel grpcChannel;

    @PostConstruct
    public void init() throws Exception {
        // 1. 读取身份证书
        X509Certificate cert = readX509Certificate(Paths.get(certPath));

        // 2. 创建身份
        Identity identity = new X509Identity(mspId, cert);

        // 3. 读取私钥
        byte[] privateKeyBytes = Files.readAllBytes(Paths.get(privateKeyPath));
        Signer signer = Signers.newPrivateKeySigner(privateKeyBytes);

        // 4. 建立 gRPC 连接
        TlsChannelCredentials tlsCredentials = TlsChannelCredentials.newBuilder()
                .trustManager(Paths.get(tlsCertPath).toFile())
                .build();

        grpcChannel = Grpc.newChannelBuilder(peerEndpoint, tlsCredentials)
                .overrideAuthority(overrideAuth)
                .build();

        // 5. 创建 Gateway 连接
        Gateway.Builder builder = Gateway.newInstance()
                .identity(identity)
                .signer(signer)
                .connection(grpcClient)
                .evaluateOptions(CallOption.deadlineAfter(5, TimeUnit.SECONDS))
                .endorseOptions(CallOption.deadlineAfter(15, TimeUnit.SECONDS))
                .submitOptions(CallOption.deadlineAfter(30, TimeUnit.SECONDS))
                .commitStatusOptions(CallOption.deadlineAfter(60, TimeUnit.SECONDS));

        gateway = builder.connect();

        // 6. 获取网络和合约
        network = gateway.getNetwork(channelName);
        contract = network.getContract(chaincodeName);

        System.out.println("✓ Fabric Gateway connected: " + mspId + " -> " + peerEndpoint);
    }

    public Contract getContract() {
        return this.contract;
    }

    @PreDestroy
    public void destroy() {
        try { gateway.close(); } catch (Exception ignored) {}
        try { grpcChannel.shutdownNow().awaitTermination(5, TimeUnit.SECONDS); } catch (Exception ignored) {}
    }

    private X509Certificate readX509Certificate(Path path) throws Exception {
        byte[] bytes = Files.readAllBytes(path);
        CertificateFactory cf = CertificateFactory.getInstance("X.509");
        return (X509Certificate) cf.generateCertificate(new ByteArrayInputStream(bytes));
    }
}
```

### 6.2 FabricService.java（业务层统一入口）

```java
package com.oaiss.fabric;

import com.oaiss.fabric.model.*;
import com.oaiss.util.HashUtil;
import com.oaiss.util.JsonUtil;
import org.hyperledger.fabric.client.Contract;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class FabricService {

    @Autowired
    private FabricGatewayProvider gatewayProvider;

    // ══════════════════════════════════════
    // 碳排放报告上链
    // ══════════════════════════════════════
    public String recordEmissionOnChain(CarbonEmissionReport report) {
        String dataHash = HashUtil.sha256(
            report.getReportNo() + report.getCompanyId() + report.getEmission()
            + report.getCoalHeatValue() + report.getCoalConsumption()
            + report.getOilHeatValue() + report.getOilConsumption()
        );

        Contract contract = gatewayProvider.getContract();
        byte[] result = contract.submitTransaction("RecordEmission",
            report.getReportNo(),
            report.getCompanyId(),
            String.valueOf(report.getEmission()),
            String.valueOf(report.getCoalHeatValue()),
            String.valueOf(report.getCoalConsumption()),
            String.valueOf(report.getOilHeatValue()),
            String.valueOf(report.getOilConsumption()),
            dataHash,
            report.getUploaderCode(),
            report.getSubmitTime().toString()
        );

        return new String(result, StandardCharsets.UTF_8);
    }

    // ══════════════════════════════════════
    // 审核记录上链
    // ══════════════════════════════════════
    public String recordAuditOnChain(AuditRecord audit, CarbonEmissionReport report) {
        String dataHash = HashUtil.sha256(
            audit.getReportId() + audit.getAuditResult()
            + audit.getPollutionStatus() + audit.getImpactAssessment()
        );

        Contract contract = gatewayProvider.getContract();
        byte[] result = contract.submitTransaction("RecordAudit",
            report.getReportNo(),
            audit.getAuditorId().toString(),
            audit.getAuditResult(),
            audit.getPollutionStatus(),
            audit.getImpactAssessment() != null ? audit.getImpactAssessment() : "",
            audit.getEmissionLevel() != null ? audit.getEmissionLevel() : "",
            audit.getRejectReason() != null ? audit.getRejectReason() : "",
            dataHash,
            audit.getAuditTime().toString()
        );

        return new String(result, StandardCharsets.UTF_8);
    }

    // ══════════════════════════════════════
    // 交易记录上链
    // ══════════════════════════════════════
    public String recordTradeOnChain(TransactionRecord tx) {
        String dataHash = HashUtil.sha256(
            tx.getTxHash() + tx.getBuyerId() + tx.getSellerId()
            + tx.getPrice() + tx.getQuantity() + tx.getTotalAmount()
        );

        Contract contract = gatewayProvider.getContract();
        byte[] result = contract.submitTransaction("RecordTrade",
            tx.getTxHash(),
            tx.getBlockHash(),
            String.valueOf(tx.getBlockHeight()),
            tx.getBuyerId(),
            tx.getSellerId(),
            tx.getBuyerName(),
            tx.getSellerName(),
            String.valueOf(tx.getPrice()),
            String.valueOf(tx.getQuantity()),
            String.valueOf(tx.getTotalAmount()),
            dataHash,
            tx.getTxTime().toString()
        );

        return new String(result, StandardCharsets.UTF_8);
    }

    // ══════════════════════════════════════
    // 链上查询
    // ══════════════════════════════════════
    public String queryEmissionOnChain(String reportNo) {
        Contract contract = gatewayProvider.getContract();
        byte[] result = contract.evaluateTransaction("QueryEmission", reportNo);
        return new String(result, StandardCharsets.UTF_8);
    }

    public String queryTradeOnChain(String txHash) {
        Contract contract = gatewayProvider.getContract();
        byte[] result = contract.evaluateTransaction("QueryTradeByHash", txHash);
        return new String(result, StandardCharsets.UTF_8);
    }

    // ══════════════════════════════════════
    // 哈希校验（防篡改）
    // ══════════════════════════════════════
    public boolean verifyEmissionIntegrity(String reportNo, String chainOffHash) {
        Contract contract = gatewayProvider.getContract();
        byte[] result = contract.evaluateTransaction("VerifyEmissionHash", reportNo, chainOffHash);
        return "true".equals(new String(result, StandardCharsets.UTF_8));
    }
}
```

### 6.3 HashUtil.java

```java
package com.oaiss.util;

import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

public class HashUtil {

    public static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder("0x");
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 failed", e);
        }
    }
}
```

### 6.4 application.yml（Fabric 配置部分）

```yaml
fabric:
  msp-id: EnterpriseMSP
  channel-name: carbonchannel
  chaincode-name: carboncc
  certificate-path: classpath:fabric/wallet/enterprise-admin-cert.pem
  private-key-path: classpath:fabric/wallet/enterprise-admin-key.pem
  tls-cert-path: classpath:fabric/crypto-config/tlsca.enterprise.oaiss.com-cert.pem
  peer-endpoint: grpcs://localhost:7051
  override-auth: peer0.enterprise.oaiss.com
```

---

## 7. 上链策略

### 7.1 哪些数据上链 vs 留在 MySQL

| 数据类别 | MySQL（链下） | Fabric（链上） | 理由 |
|---------|-------------|---------------|------|
| 用户信息 | ✅ 全部字段 | ❌ | 个人信息变动频繁，无上链必要 |
| 企业账户余额 | ✅ 全部字段 | ❌ | 撮合后频繁变动，链上存证交易记录即可推导余额 |
| **碳排放报告** | ✅ 完整数据 | ✅ **哈希 + 关键字段** | 审核通过后的报告数据不可篡改，链上存证排放量和 SHA256 |
| **审核记录** | ✅ 完整数据 | ✅ **审核结果 + 哈希** | 审核决策不可篡改 |
| 交易订单（挂单中） | ✅ 全部字段 | ❌ | 未成交订单频繁变更/撤单，不必要上链 |
| 订单簿（Bid/Ask） | ✅ 全部字段 | ❌ | 高频读写，不适合上链 |
| **完成撮合的交易** | ✅ 镜像记录 | ✅ **完整交易记录** | 已成交的交易是碳配额流转的唯一凭证，必须上链 |
| **P2P 完成订单** | ✅ 完整数据 | ✅ **交易哈希 + 关键字段** | 上链存证 |
| 系统配置 | ✅ 全部字段 | ❌ | 运维数据 |
| 行情统计 | ✅ 全部字段 | ❌ | 计算值，可从交易记录导出 |

### 7.2 上链时机

```
时间轴 ──────────────────────────────────────────────────────────────>

① 企业提交碳排放报告
   │
   ├─ MySQL: INSERT carbon_emission_reports (status=pending)
   │
   └─ Fabric: ❌ 不上链（等待审核）

② 审核员审核通过
   │
   ├─ MySQL: UPDATE carbon_emission_reports (status=approved)
   │  MySQL: UPDATE enterprise_accounts (carbon_quota += emission)
   │  MySQL: INSERT audit_records
   │
   └─ Fabric: ✅ RecordEmission (报告哈希)
      Fabric: ✅ RecordAudit (审核结果)

③ 企业下单 → 撮合成功 → 交易执行
   │
   ├─ MySQL: INSERT trading_orders (status=completed)
   │  MySQL: UPDATE enterprise_accounts (funds, quotas)
   │  MySQL: INSERT blockchain_transactions (is_on_chain=0)
   │
   └─ Fabric: ✅ RecordTrade (完整交易记录)
      MySQL: UPDATE blockchain_transactions (is_on_chain=1)

④ P2P 订单完成
   │
   ├─ MySQL: UPDATE p2p_orders (status=completed)
   │  MySQL: UPDATE enterprise_accounts
   │
   └─ Fabric: ✅ RecordTrade (P2P 交易记录)
```

### 7.3 上链代码（在 Service 层调用）

```java
// CarbonServiceImpl.java — 审核通过后的上链调用
@Transactional
public void approveReport(Long reportId, Long auditorId, AuditDTO dto) {
    // === 第一步：更新 MySQL（链下）===
    CarbonEmissionReport report = carbonMapper.selectById(reportId);
    report.setAuditStatus("approved");
    carbonMapper.updateById(report);

    AuditRecord audit = buildAuditRecord(reportId, auditorId, dto);
    auditMapper.insert(audit);

    // 发放配额
    EnterpriseAccount account = accountMapper.selectByCompanyId(report.getCompanyId());
    account.setCarbonQuota(account.getCarbonQuota().add(BigDecimal.valueOf(report.getEmission())));
    accountMapper.updateById(account);

    // === 第二步：上链 Fabric ===
    try {
        String fabricTxID = fabricService.recordEmissionOnChain(report);
        report.setFabricTxId(fabricTxID);
        carbonMapper.updateById(report);

        String auditFabricTxID = fabricService.recordAuditOnChain(audit, report);
        audit.setFabricTxId(auditFabricTxID);
        auditMapper.updateById(audit);

        log.info("✓ 碳排放报告 {} 已上链, Fabric TX: {}", report.getReportNo(), fabricTxID);
    } catch (Exception e) {
        log.warn("⚠ 上链失败，将进入对账重试队列: {}", e.getMessage());
        reconciliationService.recordPending(report.getId(), "emission");
    }
}
```

---

## 8. 交易撮合逻辑

### 8.1 撮合规则

| 规则 | 说明 |
|------|------|
| **价格优先** | 买单按价格从高到低排序，卖单按价格从低到高排序 |
| **时间优先** | 同价格下，先挂单先成交 |
| **撮合触发** | 新订单进入时立即尝试撮合 |
| **部分成交** | 允许：剩余数量继续留在订单簿 |
| **成交价** | 以**挂单方价格**为成交价（taker 吃 maker） |
| **资金冻结** | 下单时冻结资金/配额，撤单时返还，成交时扣除 |

### 8.2 MatchingEngine.java

```java
package com.oaiss.module.trading.service;

import com.oaiss.module.trading.entity.*;
import com.oaiss.module.user.entity.EnterpriseAccount;
import com.oaiss.module.user.mapper.EnterpriseAccountMapper;
import com.oaiss.module.trading.mapper.*;
import com.oaiss.fabric.FabricService;
import com.oaiss.util.HashUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class MatchingEngine {

    @Autowired private TradingOrderMapper orderMapper;
    @Autowired private OrderBookMapper orderBookMapper;
    @Autowired private TxRecordMapper txRecordMapper;
    @Autowired private EnterpriseAccountMapper accountMapper;
    @Autowired private FabricService fabricService;

    /**
     * 新订单撮合入口
     *
     * @param order 新创建的订单（已入 MySQL，状态为 pending）
     * @return 撮合生成的交易记录列表
     */
    @Transactional(rollbackFor = Exception.class)
    public List<TransactionRecord> match(TradingOrder order) {
        boolean isBuy = "buy".equals(order.getSide());

        // 1. 获取对手盘订单（按价格优先、时间优先排序）
        List<OrderBookEntry> counterparties = getCounterparties(order, isBuy);

        // 2. 执行撮合
        List<TransactionRecord> matchedTxs = new ArrayList<>();
        BigDecimal remaining = order.getQuantity();
        int filledQuantity = BigDecimal.ZERO.intValue();

        for (OrderBookEntry cp : counterparties) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;

            // 价格检查
            boolean canMatch = isBuy
                ? order.getPrice().compareTo(cp.getPrice()) >= 0
                : order.getPrice().compareTo(cp.getPrice()) <= 0;

            if (!canMatch) break;

            // 计算成交量
            BigDecimal fillQty = remaining.min(cp.getQuantity());
            BigDecimal tradePrice = cp.getPrice();  // 以对手方价格成交
            BigDecimal tradeAmount = tradePrice.multiply(fillQty);

            remaining = remaining.subtract(fillQty);
            cp.setQuantity(cp.getQuantity().subtract(fillQty));

            // 更新订单簿
            if (cp.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                orderBookMapper.deleteById(cp.getId());
            } else {
                orderBookMapper.updateById(cp);
            }

            // 更新双方账户余额
            updateAccountBalance(order, cp, isBuy, fillQty, tradePrice, tradeAmount);

            // 生成交易记录
            TransactionRecord tx = createTransactionRecord(order, cp, tradePrice, fillQty, tradeAmount);
            txRecordMapper.insert(tx);
            matchedTxs.add(tx);
        }

        // 3. 更新订单状态
        BigDecimal filled = order.getOriginalQuantity().subtract(remaining);
        order.setFilledQuantity(filled);
        order.setQuantity(remaining);

        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            order.setStatus("completed");
        } else if (filled.compareTo(BigDecimal.ZERO) > 0) {
            order.setStatus("partial");
            // 剩余部分加入订单簿
            addToOrderBook(order);
        } else {
            // 未成交，加入订单簿
            addToOrderBook(order);
        }
        orderMapper.updateById(order);

        // 4. 批量上链
        matchedTxs.forEach(this::submitToFabric);

        return matchedTxs;
    }

    // ═══ 辅助方法 ═══

    private List<OrderBookEntry> getCounterparties(TradingOrder order, boolean isBuy) {
        List<OrderBookEntry> entries = orderBookMapper.selectBySide(
            isBuy ? "sell" : "buy"
        );

        // 买单 → 卖单按价格升序；卖单 → 买单按价格降序
        if (isBuy) {
            entries.sort(Comparator.comparing(OrderBookEntry::getPrice)
                .thenComparing(OrderBookEntry::getCreatedAt));
        } else {
            entries.sort(Comparator.comparing(OrderBookEntry::getPrice).reversed()
                .thenComparing(OrderBookEntry::getCreatedAt));
        }
        return entries;
    }

    private void updateAccountBalance(TradingOrder order, OrderBookEntry cp,
            boolean isBuy, BigDecimal fillQty,
            BigDecimal tradePrice, BigDecimal tradeAmount) {

        if (isBuy) {
            // 当前用户是买方
            EnterpriseAccount buyer = accountMapper.selectByCompanyId(order.getCompanyId());
            EnterpriseAccount seller = accountMapper.selectByCompanyId(cp.getCompanyId());

            buyer.setFrozenFunds(buyer.getFrozenFunds().subtract(tradeAmount));
            buyer.setFunds(buyer.getFunds().subtract(tradeAmount));
            buyer.setCarbonQuota(buyer.getCarbonQuota().add(fillQty));

            seller.setFrozenQuota(seller.getFrozenQuota().subtract(fillQty));
            seller.setCarbonQuota(seller.getCarbonQuota().subtract(fillQty));
            seller.setFunds(seller.getFunds().add(tradeAmount));

            accountMapper.updateById(buyer);
            accountMapper.updateById(seller);
        } else {
            // 当前用户是卖方
            EnterpriseAccount seller = accountMapper.selectByCompanyId(order.getCompanyId());
            EnterpriseAccount buyer = accountMapper.selectByCompanyId(cp.getCompanyId());

            seller.setFrozenQuota(seller.getFrozenQuota().subtract(fillQty));
            seller.setCarbonQuota(seller.getCarbonQuota().subtract(fillQty));
            seller.setFunds(seller.getFunds().add(tradeAmount));

            buyer.setFrozenFunds(buyer.getFrozenFunds().subtract(tradeAmount));
            buyer.setFunds(buyer.getFunds().subtract(tradeAmount));
            buyer.setCarbonQuota(buyer.getCarbonQuota().add(fillQty));

            accountMapper.updateById(buyer);
            accountMapper.updateById(seller);
        }
    }

    private TransactionRecord createTransactionRecord(
            TradingOrder order, OrderBookEntry cp,
            BigDecimal tradePrice, BigDecimal fillQty, BigDecimal tradeAmount) {

        boolean isBuy = "buy".equals(order.getSide());
        String buyerId = isBuy ? order.getCompanyId() : cp.getCompanyId();
        String sellerId = isBuy ? cp.getCompanyId() : order.getCompanyId();

        String dataHash = HashUtil.sha256(
            buyerId + sellerId + tradePrice + fillQty + tradeAmount + System.currentTimeMillis()
        );
        String txHash = "0x" + dataHash.substring(2, 66);

        TransactionRecord tx = new TransactionRecord();
        tx.setTxHash(txHash);
        tx.setBlockHash(computeBlockHash());  // 简化：生成模拟区块哈希
        tx.setBlockHeight(getNextBlockHeight());
        tx.setBuyOrderId(isBuy ? order.getId() : cp.getOrderId());
        tx.setSellOrderId(isBuy ? cp.getOrderId() : order.getId());
        tx.setBuyerId(buyerId);
        tx.setSellerId(sellerId);
        tx.setPrice(tradePrice);
        tx.setQuantity(fillQty);
        tx.setTotalAmount(tradeAmount);
        tx.setDataHash(dataHash);
        tx.setIsOnChain(false);  // 先入库，异步上链
        tx.setTxTime(LocalDateTime.now());
        return tx;
    }

    private void addToOrderBook(TradingOrder order) {
        OrderBookEntry entry = new OrderBookEntry();
        entry.setOrderId(order.getId());
        entry.setCompanyId(order.getCompanyId());
        entry.setPrice(order.getPrice());
        entry.setQuantity(order.getQuantity());
        entry.setSide(order.getSide());
        entry.setCreatedAt(LocalDateTime.now());
        orderBookMapper.insert(entry);
    }

    private void submitToFabric(TransactionRecord tx) {
        try {
            String fabricTxID = fabricService.recordTradeOnChain(tx);
            tx.setFabricTxId(fabricTxID);
            tx.setIsOnChain(true);
            txRecordMapper.updateById(tx);
            log.info("✓ 交易 {} 已上链, Fabric TX: {}", tx.getTxHash(), fabricTxID);
        } catch (Exception e) {
            log.warn("⚠ 交易上链失败，进入对账队列: {}", tx.getTxHash());
            reconciliationService.recordPending(tx.getId(), "trade");
        }
    }
}
```

---

## 9. 数据一致性设计

### 9.1 核心原则

```
MySQL（数据源） ──写入──> MySQL（业务数据）
     │                        │
     ├──计算哈希──> 上链 ──> Fabric（防篡改存证）
     │                        │
     └──对账──<────查询──<────┘
```

**策略**: "先写 MySQL，再上链；定时对账，最终一致"

### 9.2 写入流程

```
1. 开启 MySQL 事务
2. 执行业务逻辑（更新账户、插入记录）
3. 提交 MySQL 事务（COMMIT）
4. 调用 Fabric 上链（异步 best-effort）
   ├─ 成功 → 更新 MySQL 的 fabric_tx_id + is_on_chain = 1
   └─ 失败 → 记录到 reconciliation_log，等待定时对账重试
```

### 9.3 对账定时任务

```java
package com.oaiss.scheduler;

import com.oaiss.fabric.FabricService;
import com.oaiss.module.carbon.mapper.CarbonReportMapper;
import com.oaiss.module.carbon.entity.CarbonEmissionReport;
import com.oaiss.util.HashUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ReconciliationJob {

    @Autowired private ReconciliationLogMapper reconMapper;
    @Autowired private CarbonReportMapper carbonMapper;
    @Autowired private TxRecordMapper txMapper;
    @Autowired private FabricService fabricService;

    /**
     * 每 5 分钟执行一次对账
     */
    @Scheduled(fixedDelay = 300_000)
    public void reconcile() {
        // 1. 重试未上链的记录
        List<ReconciliationLog> pending = reconMapper.selectUnconfirmed(3);
        for (ReconciliationLog log : pending) {
            retryOnChain(log);
        }

        // 2. 校验已上链数据的哈希一致性
        List<CarbonEmissionReport> reports = carbonMapper.selectOnChain();
        for (CarbonEmissionReport report : reports) {
            verifyHash(report);
        }
    }

    private void retryOnChain(ReconciliationLog log) {
        try {
            switch (log.getBizType()) {
                case "emission":
                    CarbonEmissionReport report = carbonMapper.selectById(log.getBizId());
                    String txId = fabricService.recordEmissionOnChain(report);
                    report.setFabricTxId(txId);
                    carbonMapper.updateById(report);
                    break;
                case "trade":
                    TransactionRecord tx = txMapper.selectById(log.getBizId());
                    String txTxId = fabricService.recordTradeOnChain(tx);
                    tx.setFabricTxId(txTxId);
                    tx.setIsOnChain(true);
                    txMapper.updateById(tx);
                    break;
            }
            reconMapper.markConsistent(log.getId());
            log.info("✓ 对账重试成功: {}/{}", log.getBizType(), log.getBizId());
        } catch (Exception e) {
            reconMapper.incrementRetry(log.getId());
            log.error("✗ 对账重试失败: {}/{} (retry {})", log.getBizType(), log.getBizId(), log.getRetryCount());
        }
    }

    private void verifyHash(CarbonEmissionReport report) {
        String mysqlHash = HashUtil.sha256(
            report.getReportNo() + report.getCompanyId() + report.getEmission()
            + report.getCoalHeatValue() + report.getCoalConsumption()
        );
        boolean consistent = fabricService.verifyEmissionIntegrity(
            report.getReportNo(), mysqlHash
        );
        if (!consistent) {
            log.error("⚠ 数据不一致！报告 {} 的 MySQL 哈希与链上哈希不匹配", report.getReportNo());
            // 触发告警（邮件/钉钉/企业微信）
        }
    }
}
```

### 9.4 一致性保障矩阵

| 场景 | 处理方式 |
|------|---------|
| MySQL 写成功，Fabric 写成功 | ✅ 最终一致 |
| MySQL 写成功，Fabric 写失败 | 记录到 reconciliation_log，定时重试（最多3次），超过阈值告警 |
| MySQL 写失败（事务回滚） | Fabric 未调用，无脏数据 |
| 对账发现哈希不一致 | 告警 → 人工介入 → 以链上数据为准（链上不可篡改） |
| Fabric 返回但 MySQL 写回 fabric_tx_id 失败 | 下次对账时根据 Fabric 链上数据反向回填 |

---

## 10. API 接口设计

> 完整 API 清单（前端对接用）

### 10.1 认证模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录获取 Token | 公开 |
| POST | `/api/auth/logout` | 退出登录 | 登录用户 |
| GET | `/api/auth/me` | 获取当前用户信息 | 登录用户 |

### 10.2 碳排放模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/emission-reports` | 分页查询我的报告 | enterprise |
| GET | `/api/emission-reports/:id` | 报告详情 | enterprise, admin |
| POST | `/api/emission-reports` | 新增报告（自动进入待审核） | enterprise |
| PUT | `/api/emission-reports/:id` | 编辑报告 | enterprise |
| DELETE | `/api/emission-reports/:id` | 删除报告 | enterprise |
| POST | `/api/emission-reports/:id/submit` | 提交审核 | enterprise |
| GET | `/api/emission-reports/:id/onchain` | 查询链上存证 | enterprise, auditor |

### 10.3 审核模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/audit/tasks` | 审核任务列表 | auditor |
| GET | `/api/audit/tasks/:id` | 审核详情（含原始数据） | auditor |
| POST | `/api/audit/tasks/:id/approve` | 审核通过 → 发配额 → 上链 | auditor |
| POST | `/api/audit/tasks/:id/reject` | 审核驳回 → 上链 | auditor |

### 10.4 交易模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/trading/order-book` | 获取订单簿（Bid/Ask） | enterprise |
| POST | `/api/trading/orders` | 下单（触发撮合） | enterprise |
| DELETE | `/api/trading/orders/:id/cancel` | 撤单 | enterprise |
| GET | `/api/trading/orders/my` | 我的订单 | enterprise |
| GET | `/api/trading/transactions` | 成交记录（链上数据） | enterprise |
| GET | `/api/trading/transactions/:id` | 交易详情 | enterprise |
| GET | `/api/trading/stats` | 市场行情 | enterprise |

### 10.5 企业账户模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/account` | 我的账户（资金+配额） | enterprise |
| GET | `/api/account/transactions` | 我的交易记录 | enterprise |

### 10.6 管理员模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/admin/users` | 用户列表 | admin |
| POST | `/api/admin/users` | 新增用户 | admin |
| PUT | `/api/admin/users/:id` | 编辑用户 | admin |
| DELETE | `/api/admin/users/:id` | 下线用户 | admin |
| GET | `/api/admin/emission-reports` | 全部报告 | admin |
| GET | `/api/admin/configs` | 系统配置列表 | admin |
| PUT | `/api/admin/configs/:id` | 编辑系统配置 | admin |
| GET | `/api/statistics` | 数据统计 | admin |

---

## 11. 初始化 SQL

> 完整初始化脚本（含默认管理员 + 种子数据）

```sql
-- ==========================================
-- 种子数据
-- ==========================================

-- 密码均为开发环境明文（生产环境需 bcrypt）
-- bcrypt 生成命令: spring enc: 'yourpassword'

-- 管理员（密码: admin123）
INSERT INTO sys_users (username, password_hash, display_name, phone, role, credit_score)
VALUES ('admin01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '系统管理员', '139-0000-0001', 'admin', 1000);

-- 审核员（密码: auditor123）
INSERT INTO sys_users (username, password_hash, display_name, phone, role, credit_score) VALUES
('auditor01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '审核员A', '139-0000-2001', 'auditor', 980),
('auditor02', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '审核员B', '139-0000-2002', 'auditor', 950);

-- 企业用户（密码: enterprise123）
INSERT INTO sys_users (username, password_hash, display_name, phone, role, credit_score) VALUES
('enterprise01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '华东能源集团', '139-0000-1001', 'enterprise', 850),
('enterprise02', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '华南低碳科技', '139-0000-1002', 'enterprise', 920),
('enterprise03', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '华北电网平台', '139-0000-1003', 'enterprise', 780),
('enterprise04', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '蓝碳科技有限公司', '139-0000-1004', 'enterprise', 700),
('enterprise05', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '北方清洁电力集团', '139-0000-1005', 'enterprise', 880);

-- 企业账户
INSERT INTO enterprise_accounts (user_id, company_id, company_name, enterprise_type, dept_name, dept_code, funds, carbon_quota)
SELECT u.id, c.company_id, u.display_name, c.enterprise_type, c.dept_name, c.dept_code, c.funds, c.carbon_quota
FROM (
    SELECT 'enterprise01' AS uname, 'C-1001' AS company_id, '发电企业' AS enterprise_type, '华东发电一部' AS dept_name, 'D-001' AS dept_code, 1000000.00 AS funds, 50000.00 AS carbon_quota
    UNION ALL SELECT 'enterprise02', 'C-1002', '电网企业', '华南电网调度中心', 'D-002', 800000.00, 35000.00
    UNION ALL SELECT 'enterprise03', 'C-1003', '电网企业', '华北调度一部', 'D-003', 1200000.00, 60000.00
    UNION ALL SELECT 'enterprise04', 'C-1004', '发电企业', '蓝碳技术部', 'D-004', 500000.00, 25000.00
    UNION ALL SELECT 'enterprise05', 'C-1005', '发电企业', '北方发电中心', 'D-005', 1500000.00, 80000.00
) c
JOIN sys_users u ON u.username = c.uname;

-- 系统配置
INSERT INTO system_configs (config_key, config_name, config_value, description, updated_by) VALUES
('core-service', '核心业务服务', '{"host":"10.0.8.21","port":8080}', '核心业务服务配置', 'admin01'),
('chain-gateway', '区块链网关', '{"host":"10.0.8.31","port":8545}', '区块链网关配置', 'admin01'),
('audit-service', '审核服务', '{"host":"10.0.8.41","port":8082}', '审核服务配置', 'admin01'),
('emission-factor-coal', '燃煤碳排放因子', '0.12', 'tCO2/GJ', 'admin01'),
('emission-factor-oil', '燃油碳排放因子', '0.18', 'tCO2/GJ', 'admin01'),
('quota-conversion', '配额换算比例', '1', '1 tCO2e = 1 碳配额', 'admin01');
```

---

## 12. 部署与启动

### 12.1 启动顺序

```bash
# 1. 启动 Fabric 网络
cd fabric/
./network.sh up createChannel -c carbonchannel
./network.sh deployCC -ccn carboncc -ccp ../chaincode/carboncc -ccl go

# 2. 启动 MySQL
docker-compose up -d mysql redis

# 3. 初始化数据库
mysql -u root -p oaiss < sql/schema.sql
mysql -u root -p oaiss < sql/seed.sql

# 4. 启动后端
cd oaiss-server/
mvn clean package -DskipTests
java -jar target/oaiss-server-2.0.jar --spring.profiles.active=dev

# 5. 启动前端
cd oaiss/
npm install && npm run dev
```

### 12.2 Docker Compose（开发环境）

```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: oaiss
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql/schema.sql:/docker-entrypoint-initdb.d/1-schema.sql
      - ./sql/seed.sql:/docker-entrypoint-initdb.d/2-seed.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./oaiss-server
    ports:
      - "3001:3001"
    depends_on:
      - mysql
      - redis
    environment:
      SPRING_PROFILES_ACTIVE: docker
      DB_HOST: mysql
      DB_PORT: 3306

  frontend:
    build: ./oaiss
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  mysql_data:
```

### 12.3 访问地址

| 服务 | 地址 | 账号 |
|------|------|------|
| 前端 | http://localhost:5173 | 见 11 节 |
| 后端 API | http://localhost:3001/api | — |
| Swagger | http://localhost:3001/swagger-ui.html | — |
| MySQL | localhost:3306 | root/root123 |
| Redis | localhost:6379 | — |
| Fabric Peer | grpcs://localhost:7051 | — |
```

---

## 附录：数据流全链路总览

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ 1. 企业   │────>│ 2. 审核员 │────>│ 3. 自动   │────>│ 4. 企业   │
│ 提交碳排放 │     │ 审核报告  │     │ 发放配额  │     │ 持有配额  │
│ 报告      │     │ + 上链    │     │ + 上链    │     │          │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
     MySQL           MySQL           MySQL               │
     INSERT          UPDATE          UPDATE              │
     (pending)       (approved)      (quota+=emission)   │
                        │                                │
                        ├──Fabric──> EmissionRecord      │
                        │   RecordAudit                  │
                        │                                │
                                              ┌─────────▼────────┐
                                              │ 5. 交易市场       │
                                              │ 下单 → 撮合 → 成交│
                                              └─────────┬────────┘
                                                  MySQL │
                                              INSERT    │
                                              UPDATE    │
                                                        │
                                              ┌─────────▼────────┐
                                              │ 6. 上链存证       │
                                              │ RecordTrade      │
                                              │ (每笔成交记录)    │
                                              └─────────┬────────┘
                                                        │
                                              ┌─────────▼────────┐
                                              │ 7. 定时对账       │
                                              │ 校验链上链下一致  │
                                              └──────────────────┘
```
