# OAISS 碳排放管理与碳交易系统 — 项目重置与初始化操作文档

> **适用版本**: v2.0  
> **技术栈**: Vue 3 + Element Plus + Pinia（前端）| Node.js/Express + MySQL 8.0（后端）  
> **最后更新**: 2026-04-28

---

## 目录

1. [环境要求](#1-环境要求)
2. [数据清空（重置）](#2-数据清空重置)
3. [数据库初始化](#3-数据库初始化)
4. [后端初始化](#4-后端初始化)
5. [前端初始化](#5-前端初始化)
6. [系统初始化数据](#6-系统初始化数据)
7. [启动项目](#7-启动项目)
8. [验证系统](#8-验证系统)
9. [常见问题](#9-常见问题)

---

## 1. 环境要求

| 组件 | 版本要求 | 验证命令 |
|------|---------|---------|
| Node.js | >= 18.0 | `node -v` |
| npm | >= 9.0 | `npm -v` |
| MySQL | >= 8.0 | `mysql --version` |
| Redis | >= 6.0（可选） | `redis-cli ping` |

---

## 2. 数据清空（重置）

### 2.1 连接数据库

```bash
mysql -u root -p
```

### 2.2 完整重置脚本

执行以下 SQL 清空所有业务数据，保留表结构：

```sql
-- 切换到目标数据库
USE oaiss;

-- 关闭外键检查（避免 TRUNCATE 报错）
SET FOREIGN_KEY_CHECKS = 0;

-- 清空业务表
TRUNCATE TABLE blockchain_transactions;
TRUNCATE TABLE trading_orders;
TRUNCATE TABLE order_book;
TRUNCATE TABLE p2p_orders;
TRUNCATE TABLE carbon_emission_reports;
TRUNCATE TABLE audit_records;
TRUNCATE TABLE enterprise_accounts;
TRUNCATE TABLE system_configs;

-- 保留用户表但清除非管理员账号（谨慎）
DELETE FROM sys_users WHERE username NOT IN ('admin01');

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;
```

### 2.3 仅清空单个模块

```sql
-- 只清空交易相关
TRUNCATE TABLE trading_orders;
TRUNCATE TABLE order_book;
TRUNCATE TABLE p2p_orders;
TRUNCATE TABLE blockchain_transactions;

-- 只清空碳核算相关
TRUNCATE TABLE carbon_emission_reports;
TRUNCATE TABLE audit_records;

-- 只清空企业账户
TRUNCATE TABLE enterprise_accounts;
```

### 2.4 清空 Redis 缓存（如果使用）

```bash
# 方式一：flush 全部
redis-cli FLUSHALL

# 方式二：只清空 oaiss 前缀的 key（推荐）
redis-cli KEYS "oaiss:*" | xargs redis-cli DEL
```

### 2.5 完全重建数据库（开发环境）

```sql
DROP DATABASE IF EXISTS oaiss;
CREATE DATABASE oaiss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 3. 数据库初始化

### 3.1 建库

```sql
CREATE DATABASE IF NOT EXISTS oaiss
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE oaiss;
```

### 3.2 核心表结构

```sql
-- ==========================================
-- 1. 系统用户表
-- ==========================================
CREATE TABLE sys_users (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(64)  NOT NULL UNIQUE COMMENT '登录用户名',
  password_hash   VARCHAR(256) NOT NULL COMMENT 'bcrypt 密码哈希',
  display_name    VARCHAR(128) NOT NULL COMMENT '显示名称',
  phone           VARCHAR(32)  DEFAULT '' COMMENT '联系电话',
  role            ENUM('enterprise','auditor','admin') NOT NULL COMMENT '角色',
  credit_score    INT          DEFAULT 800 COMMENT '信用积分 (0-1000)',
  credit_enabled  TINYINT(1)   DEFAULT 1 COMMENT '信用积分是否启用',
  status          TINYINT(1)   DEFAULT 1 COMMENT '账户状态 1启用 0禁用',
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_username (username)
) ENGINE=InnoDB COMMENT='系统用户表';

-- ==========================================
-- 2. 企业账户表
-- ==========================================
CREATE TABLE enterprise_accounts (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL COMMENT '关联 sys_users.id',
  company_id      VARCHAR(16)  NOT NULL UNIQUE COMMENT '企业编码 (C-XXXX)',
  company_name    VARCHAR(128) NOT NULL COMMENT '企业全称',
  enterprise_type ENUM('发电企业','电网企业') NOT NULL COMMENT '企业类型',
  dept_name       VARCHAR(128) DEFAULT '' COMMENT '部门名称',
  dept_code       VARCHAR(32)  DEFAULT '' COMMENT '部门代码',
  funds           DECIMAL(20,2) DEFAULT 1000000.00 COMMENT '账户资金（元）',
  frozen_funds    DECIMAL(20,2) DEFAULT 0.00 COMMENT '冻结资金',
  carbon_quota    DECIMAL(20,2) DEFAULT 50000.00 COMMENT '碳配额持有量',
  frozen_quota    DECIMAL(20,2) DEFAULT 0.00 COMMENT '冻结配额',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES sys_users(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_company_id (company_id)
) ENGINE=InnoDB COMMENT='企业账户表';

-- ==========================================
-- 3. 碳排放报告表
-- ==========================================
CREATE TABLE carbon_emission_reports (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_no       VARCHAR(32)  NOT NULL UNIQUE COMMENT '报告编号 RPT-YYYYMM-XXXX',
  company_id      VARCHAR(16)  NOT NULL COMMENT '企业编码',
  dept_name       VARCHAR(128) NOT NULL COMMENT '部门名称',
  dept_code       VARCHAR(32)  NOT NULL COMMENT '部门代码',
  enterprise_type ENUM('发电企业','电网企业') NOT NULL,
  coal_heat_value   DECIMAL(12,2) NOT NULL COMMENT '燃煤低位热值 (kJ/kg)',
  coal_consumption  DECIMAL(12,2) NOT NULL COMMENT '燃煤消耗量 (吨)',
  oil_heat_value    DECIMAL(12,2) NOT NULL COMMENT '燃油低位热值 (kJ/kg)',
  oil_consumption   DECIMAL(12,2) NOT NULL COMMENT '燃油消耗量 (吨)',
  emission          DECIMAL(14,2) NOT NULL COMMENT '碳排放量 (tCO2e)',
  uploader_code     VARCHAR(16)  NOT NULL COMMENT '上传人员编号',
  audit_status      ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
  signed            TINYINT(1) DEFAULT 0 COMMENT '是否已提交审核',
  submit_time       DATETIME DEFAULT NULL COMMENT '提交时间',
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_id (company_id),
  INDEX idx_audit_status (audit_status)
) ENGINE=InnoDB COMMENT='碳排放报告表';

-- ==========================================
-- 4. 审核记录表
-- ==========================================
CREATE TABLE audit_records (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id         BIGINT UNSIGNED NOT NULL COMMENT '关联 carbon_emission_reports.id',
  auditor_id        BIGINT UNSIGNED NOT NULL COMMENT '审核员 sys_users.id',
  pollution_status  VARCHAR(32)  DEFAULT '' COMMENT '污染状况',
  impact_assessment TEXT         COMMENT '影响评估',
  emission_level    VARCHAR(16)  DEFAULT '' COMMENT '排放等级',
  audit_password    VARCHAR(256) DEFAULT '' COMMENT '审核密码',
  event_code        VARCHAR(32)  DEFAULT '' COMMENT '事件编码',
  reject_reason     TEXT         COMMENT '驳回原因（如果驳回）',
  audit_result      ENUM('approved','rejected') NOT NULL COMMENT '审核结果',
  audit_time        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES carbon_emission_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (auditor_id) REFERENCES sys_users(id)
) ENGINE=InnoDB COMMENT='审核记录表';

-- ==========================================
-- 5. 交易订单表（双向拍卖）
-- ==========================================
CREATE TABLE trading_orders (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       VARCHAR(16)  NOT NULL COMMENT '企业编码',
  side             ENUM('buy','sell') NOT NULL COMMENT '买卖方向',
  price            DECIMAL(12,2) NOT NULL COMMENT '委托价格',
  original_quantity DECIMAL(14,2) NOT NULL COMMENT '原始数量',
  quantity         DECIMAL(14,2) NOT NULL COMMENT '剩余数量',
  filled_quantity  DECIMAL(14,2) DEFAULT 0.00 COMMENT '已成交数量',
  status           ENUM('pending','partial','completed','cancelled') DEFAULT 'pending' COMMENT '订单状态',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_id (company_id),
  INDEX idx_status (status),
  INDEX idx_side_price (side, price)
) ENGINE=InnoDB COMMENT='交易订单表';

-- ==========================================
-- 6. 订单簿表
-- ==========================================
CREATE TABLE order_book (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL COMMENT '关联 trading_orders.id',
  company_id  VARCHAR(16) NOT NULL,
  price       DECIMAL(12,2) NOT NULL COMMENT '挂单价格',
  quantity    DECIMAL(14,2) NOT NULL COMMENT '挂单数量',
  side        ENUM('buy','sell') NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES trading_orders(id) ON DELETE CASCADE,
  INDEX idx_side_price (side, price)
) ENGINE=InnoDB COMMENT='订单簿表';

-- ==========================================
-- 7. P2P 订单表
-- ==========================================
CREATE TABLE p2p_orders (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_no         VARCHAR(32)  NOT NULL UNIQUE COMMENT '订单编号 P2P-YYYYMM-XXXX',
  buyer_id         VARCHAR(16)  NOT NULL COMMENT '买方企业编码',
  seller_id        VARCHAR(16)  NOT NULL COMMENT '卖方企业编码',
  buyer_name       VARCHAR(128) NOT NULL COMMENT '买方名称',
  seller_name      VARCHAR(128) NOT NULL COMMENT '卖方名称',
  carbon_quota     DECIMAL(14,2) NOT NULL COMMENT '碳配额数量',
  unit_price       DECIMAL(12,2) NOT NULL COMMENT '单价',
  total_amount     DECIMAL(16,2) NOT NULL COMMENT '总金额',
  app_id           VARCHAR(64) DEFAULT '' COMMENT '应用ID',
  callback_url     VARCHAR(512) DEFAULT '' COMMENT '回调地址',
  certificate_path VARCHAR(256) DEFAULT '' COMMENT '碳核算证书路径',
  query_password   VARCHAR(256) DEFAULT '' COMMENT '查询密码',
  public_key       TEXT COMMENT '区块链交易公钥',
  status           ENUM('pending','partial','completed','cancelled') DEFAULT 'pending',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_buyer (buyer_id),
  INDEX idx_seller (seller_id),
  INDEX idx_status (status)
) ENGINE=InnoDB COMMENT='P2P订单表';

-- ==========================================
-- 8. 区块链交易记录表
-- ==========================================
CREATE TABLE blockchain_transactions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tx_hash       VARCHAR(66) NOT NULL UNIQUE COMMENT '交易哈希 (0x...)',
  block_hash    VARCHAR(66) NOT NULL COMMENT '区块哈希',
  block_height  BIGINT UNSIGNED NOT NULL COMMENT '区块高度',
  buy_order_id  BIGINT UNSIGNED COMMENT '买方订单ID',
  sell_order_id BIGINT UNSIGNED COMMENT '卖方订单ID',
  buyer_id      VARCHAR(16) NOT NULL COMMENT '买方企业编码',
  seller_id     VARCHAR(16) NOT NULL COMMENT '卖方企业编码',
  buyer_name    VARCHAR(128) NOT NULL COMMENT '买方名称',
  seller_name   VARCHAR(128) NOT NULL COMMENT '卖方名称',
  price         DECIMAL(12,2) NOT NULL COMMENT '成交价格',
  quantity      DECIMAL(14,2) NOT NULL COMMENT '成交数量',
  total_amount  DECIMAL(16,2) NOT NULL COMMENT '成交总金额',
  status        VARCHAR(16) DEFAULT 'completed' COMMENT '交易状态',
  tx_time       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '交易时间',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_buyer (buyer_id),
  INDEX idx_seller (seller_id),
  INDEX idx_block_height (block_height)
) ENGINE=InnoDB COMMENT='区块链交易记录表';

-- ==========================================
-- 9. 系统配置表
-- ==========================================
CREATE TABLE system_configs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  config_key  VARCHAR(64)  NOT NULL UNIQUE COMMENT '配置键',
  config_name VARCHAR(128) NOT NULL COMMENT '配置名称',
  config_value TEXT        NOT NULL COMMENT '配置值',
  description VARCHAR(256) DEFAULT '' COMMENT '配置说明',
  updated_by  VARCHAR(64)  DEFAULT '' COMMENT '修改人',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='系统配置表';
```

---

## 4. 后端初始化

### 4.1 项目结构

```
oaiss-server
```

### 4.2 安装依赖

```bash
cd oaiss-server
npm install
```

### 4.3 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```bash
# .env — 后端环境变量
NODE_ENV=development
PORT=3001

# === MySQL ===
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=oaiss
DB_POOL_MAX=10
DB_POOL_MIN=2

# === Redis（可选）===
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# === JWT ===
JWT_SECRET=oaiss_jwt_secret_key_2026
JWT_EXPIRES_IN=7d

# === 碳排放因子 ===
COAL_EMISSION_FACTOR=0.12
OIL_EMISSION_FACTOR=0.18

# === CORS ===
CORS_ORIGIN=http://localhost:5173
```

### 4.4 数据库连接配置

`src/config/db.js`:

```javascript
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_MAX) || 10,
  queueLimit: 0,
})

export default pool
```

### 4.5 初始化表结构

```bash
# 方式一：通过 mysql 客户端执行
mysql -u root -p oaiss < sql/init.sql

# 方式二：通过 Node.js 脚本执行
node scripts/migrate.js
```

---

## 5. 前端初始化

### 5.1 安装依赖

```bash
cd oaiss
npm install
```

### 5.2 配置 API 地址

创建 `src/config/api.js`（如果不存在）：

```javascript
// src/config/api.js
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'

export const API = {
  // 认证
  LOGIN: `${API_BASE}/auth/login`,
  LOGOUT: `${API_BASE}/auth/logout`,

  // 碳排放报告
  EMISSION_REPORTS: `${API_BASE}/emission-reports`,
  EMISSION_REPORT: (id) => `${API_BASE}/emission-reports/${id}`,
  SUBMIT_FOR_AUDIT: (id) => `${API_BASE}/emission-reports/${id}/submit`,

  // 审核
  AUDIT_TASKS: `${API_BASE}/audit/tasks`,
  AUDIT_DETAIL: (id) => `${API_BASE}/audit/tasks/${id}`,
  AUDIT_APPROVE: (id) => `${API_BASE}/audit/tasks/${id}/approve`,
  AUDIT_REJECT: (id) => `${API_BASE}/audit/tasks/${id}/reject`,

  // 交易
  TRADING_ORDERS: `${API_BASE}/trading/orders`,
  TRADING_ORDER: (id) => `${API_BASE}/trading/orders/${id}`,
  TRADING_CANCEL: (id) => `${API_BASE}/trading/orders/${id}/cancel`,
  ORDER_BOOK: `${API_BASE}/trading/order-book`,
  TRANSACTIONS: `${API_BASE}/trading/transactions`,
  MARKET_STATS: `${API_BASE}/trading/stats`,

  // P2P 订单
  P2P_ORDERS: `${API_BASE}/p2p/orders`,
  P2P_ORDER: (id) => `${API_BASE}/p2p/orders/${id}`,

  // 企业账户
  ACCOUNT: `${API_BASE}/account`,
  ACCOUNT_TRANSACTIONS: `${API_BASE}/account/transactions`,

  // 用户管理 (Admin)
  USERS: `${API_BASE}/admin/users`,
  USER: (id) => `${API_BASE}/admin/users/${id}`,

  // 系统配置 (Admin)
  SYSTEM_CONFIGS: `${API_BASE}/admin/configs`,
  SYSTEM_CONFIG: (id) => `${API_BASE}/admin/configs/${id}`,

  // 数据统计
  STATISTICS: `${API_BASE}/statistics`,
}
```

创建 `.env` 文件中的前端环境变量：

```bash
# .env（前端根目录）
VITE_API_BASE=http://localhost:3001/api
VITE_APP_TITLE=碳资产监管后台
```

### 5.3 移除 Mock 模式，接入真实 API

当前前端使用 Pinia Store (`src/store/carbon.js`) 存储硬编码 mock 数据。接入后端后，将 Store 改为 API 调用模式：

```javascript
// src/store/carbon.js 中 actions 改写示例
import { API } from '../config/api'

actions: {
  async addEmissionReport(report) {
    const res = await fetch(API.EMISSION_REPORTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(report),
    })
    const data = await res.json()
    if (data.success) {
      this.emissionReports.unshift(data.report)
    }
    return data
  },

  async submitForAudit(reportId) {
    const res = await fetch(API.SUBMIT_FOR_AUDIT(reportId), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    })
    const data = await res.json()
    if (data.success) {
      // 更新本地状态
    }
    return data
  },
  // ... 其他 action 同理
}
```

> **注意**: 在完成后端 API 对接前，可以保留现有的 `useCarbonStore` mock 模式进行前端开发调试。真正的 API 切换只需要替换 actions 中的实现即可。

---

## 6. 系统初始化数据

### 6.1 默认管理员账号

```sql
-- 管理员账号（密码: admin123，实际应使用 bcrypt 哈希）
-- 本地开发用明文密码，生产环境必须使用 bcrypt

INSERT INTO sys_users (username, password_hash, display_name, phone, role, credit_score)
VALUES ('admin01', '$2b$10$EXAMPLE_BCRYPT_HASH_HERE', '系统管理员', '139-0000-0001', 'admin', 1000);

-- 审核员账号（密码: auditor123）
INSERT INTO sys_users (username, password_hash, display_name, phone, role, credit_score)
VALUES
  ('auditor01', '$2b$10$EXAMPLE_BCRYPT_HASH_HERE', '审核员A', '139-0000-2001', 'auditor', 980),
  ('auditor02', '$2b$10$EXAMPLE_BCRYPT_HASH_HERE', '审核员B', '139-0000-2002', 'auditor', 950);

-- 企业用户账号（密码: enterprise123）
INSERT INTO sys_users (username, password_hash, display_name, phone, role, credit_score)
VALUES
  ('enterprise01', '$2b$10$EXAMPLE_BCRYPT_HASH_HERE', '华东能源集团', '139-0000-1001', 'enterprise', 850),
  ('enterprise02', '$2b$10$EXAMPLE_BCRYPT_HASH_HERE', '华南低碳科技', '139-0000-1002', 'enterprise', 920),
  ('enterprise03', '$2b$10$EXAMPLE_BCRYPT_HASH_HERE', '华北电网平台', '139-0000-1003', 'enterprise', 780),
  ('enterprise04', '$2b$10$EXAMPLE_BCRYPT_HASH_HERE', '蓝碳科技有限公司', '139-0000-1004', 'enterprise', 700),
  ('enterprise05', '$2b$10$EXAMPLE_BCRYPT_HASH_HERE', '北方清洁电力集团', '139-0000-1005', 'enterprise', 880);
```

### 6.2 企业账户初始化

```sql
INSERT INTO enterprise_accounts (user_id, company_id, company_name, enterprise_type, dept_name, dept_code, funds, carbon_quota)
VALUES
  ((SELECT id FROM sys_users WHERE username='enterprise01'), 'C-1001', '华东能源集团', '发电企业', '华东发电一部', 'D-001', 1000000.00, 50000.00),
  ((SELECT id FROM sys_users WHERE username='enterprise02'), 'C-1002', '华南低碳科技', '电网企业', '华南电网调度中心', 'D-002', 800000.00, 35000.00),
  ((SELECT id FROM sys_users WHERE username='enterprise03'), 'C-1003', '华北电网平台', '电网企业', '华北调度一部', 'D-003', 1200000.00, 60000.00),
  ((SELECT id FROM sys_users WHERE username='enterprise04'), 'C-1004', '蓝碳科技有限公司', '发电企业', '蓝碳技术部', 'D-004', 500000.00, 25000.00),
  ((SELECT id FROM sys_users WHERE username='enterprise05'), 'C-1005', '北方清洁电力集团', '发电企业', '北方发电中心', 'D-005', 1500000.00, 80000.00);
```

### 6.3 系统配置初始化

```sql
INSERT INTO system_configs (config_key, config_name, config_value, description, updated_by)
VALUES
  ('core-service', '核心业务服务', '{"host":"10.0.8.21","port":8080}', '核心业务服务配置', 'admin01'),
  ('chain-gateway', '区块链网关', '{"host":"10.0.8.31","port":8545,"chain_mode":"mainnet"}', '区块链网关配置', 'admin01'),
  ('audit-service', '审核服务', '{"host":"10.0.8.41","port":8082}', '审核服务配置', 'admin01'),
  ('emission-factor-coal', '燃煤碳排放因子', '0.12', '燃煤低位热值碳排放因子 (tCO2/GJ)', 'admin01'),
  ('emission-factor-oil', '燃油碳排放因子', '0.18', '燃油低位热值碳排放因子 (tCO2/GJ)', 'admin01'),
  ('quota-conversion', '配额换算比例', '1', '1 tCO2e = 1 碳配额单位 = 1 碳币', 'admin01');
```

### 6.4 生成 bcrypt 密码哈希（开发用）

```bash
# 在 oaiss-server 目录执行
node -e "
const bcrypt = require('bcryptjs');
console.log('admin123 =>', bcrypt.hashSync('admin123', 10));
console.log('auditor123 =>', bcrypt.hashSync('auditor123', 10));
console.log('enterprise123 =>', bcrypt.hashSync('enterprise123', 10));
"
```

将输出的哈希值替换到 6.1 节 SQL 中的 `EXAMPLE_BCRYPT_HASH_HERE`。

---

## 7. 启动项目

### 7.1 启动数据库

```bash
# macOS
brew services start mysql

# Linux (systemd)
sudo systemctl start mysql

# Windows
net start MySQL80
```

### 7.2 启动后端

```bash
cd oaiss-server

# 开发模式（支持热重载）
npm run dev

# 生产模式
npm run build
npm start
```

预期输出：

```
[server] MySQL connected: oaiss@127.0.0.1:3306
[server] Redis connected: 127.0.0.1:6379
[server] Server running on http://localhost:3001
[server] Environment: development
```

### 7.3 启动前端

```bash
cd oaiss

# 开发模式
npm run dev

# 生产构建
npm run build
npm run preview
```

预期输出：

```
  VITE v8.0.10  ready in 432 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 7.4 访问地址

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5173 |
| 后端 API | http://localhost:3001/api |
| API 健康检查 | http://localhost:3001/api/health |

### 7.5 默认账号密码

| 角色 | 用户名 | 密码 | 首页 |
|------|--------|------|------|
| 管理员 | admin01 | admin123 | /admin/system/users |
| 审核员 | auditor01 | auditor123 | /auditor/audit/list |
| 企业用户 | enterprise01 | enterprise123 | /enterprise/carbon/upload |

---

## 8. 验证系统

### 8.1 后端健康检查

```bash
curl http://localhost:3001/api/health
# 应返回: {"status":"ok","db":"connected","timestamp":"2026-04-28T..."}
```

### 8.2 登录测试

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin01","password":"admin123"}'
# 应返回: {"token":"eyJ...","user":{"username":"admin01","role":"admin"}}
```

### 8.3 前端验证清单

| 检查项 | 操作 | 预期结果 |
|--------|------|---------|
| 登录 | 用各角色账号分别登录 | 跳转到对应首页 |
| 企业-碳核算 | 新增碳排放报告 → 点击提交审核 | 报告进入待审核状态 |
| 审核-审核列表 | 查看待审核报告 → 点击审核 | 跳转审核详情页 |
| 审核-审核详情 | 填写审核表单 → 通过 | 自动发放配额到企业账户 |
| 企业-账户中心 | 查看账户页面 | 配额数量增加 |
| 企业-交易市场 | 买入/卖出碳配额 | 自动撮合，账户余额变化 |
| 企业-P2P订单 | 创建P2P订单 → 确认完成 | 生成链上交易记录 |
| 企业-数据可视化 | 查看仪表盘 | 数据与运营数据联动 |
| 管理员-用户管理 | 新增/编辑/下线用户 | 操作成功 |
| 管理员-碳核算管理 | 查看所有企业报告 | 显示全部报告 |
| 管理员-统计数据 | 查看仪表盘 | 全局数据正确 |

---

## 9. 常见问题

### 9.1 数据库连接失败

```bash
# 错误: Error: connect ECONNREFUSED 127.0.0.1:3306
# 原因: MySQL 未启动
# 解决:
sudo systemctl start mysql          # Linux
brew services start mysql           # macOS

# 错误: ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'
# 原因: 密码错误
# 解决: 检查 .env 中 DB_PASSWORD 是否正确
mysql -u root -p -e "SELECT 1"      # 验证密码
```

### 9.2 端口冲突

```bash
# 前端端口 5173 被占用
lsof -i :5173
kill -9 <PID>

# 后端端口 3001 被占用
lsof -i :3001
kill -9 <PID>

# 修改端口: 编辑 .env 中 PORT 或 VITE_API_BASE
```

### 9.3 npm install 失败

```bash
# 清缓存重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 使用国内镜像
npm config set registry https://registry.npmmirror.com
npm install
```

### 9.4 Vite 启动报错 EACCES

```bash
# 错误: EACCES: permission denied, mkdir '.../node_modules/.vite'
# 原因: 文件权限问题
sudo chown -R $(whoami) node_modules
npm run dev
```

### 9.5 Table doesn't exist

```bash
# 错误: Table 'oaiss.sys_users' doesn't exist
# 原因: 未执行表结构初始化
# 解决:
mysql -u root -p oaiss < sql/init.sql

# 或者确认数据库名称是否正确
mysql -u root -p -e "SHOW TABLES FROM oaiss"
```

### 9.6 CORS 跨域错误（前端调用后端 API 时）

```bash
# 浏览器控制台: Access to XMLHttpRequest has been blocked by CORS policy
# 解决: 确保后端已配置 CORS，且前端 .env 中 VITE_API_BASE 正确
# 后端需设置:
#   Access-Control-Allow-Origin: http://localhost:5173
#   或开发环境使用 Vite proxy（见下方）
```

Vite 开发代理配置（`vite.config.js`）：

```javascript
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

配置 proxy 后，前端 `.env` 中 `VITE_API_BASE` 应设为空或 `/api`：

```bash
# .env
VITE_API_BASE=/api
```

### 9.7 Redis 连接失败（非必需）

```bash
# 如果未安装 Redis 或不需要缓存，后端会自动降级运行
# 如需启动 Redis:
sudo systemctl start redis-server    # Linux
brew services start redis            # macOS
```

---

## 附录 A：一键初始化脚本

创建 `scripts/setup.sh`：

```bash
#!/bin/bash
set -e

echo "=== OAISS 系统初始化 ==="

# 1. 创建数据库
echo "[1/5] 创建数据库..."
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS oaiss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 初始化表结构
echo "[2/5] 初始化表结构..."
mysql -u root -p oaiss < sql/init.sql

# 3. 初始化种子数据
echo "[3/5] 初始化种子数据..."
mysql -u root -p oaiss < sql/seed.sql

# 4. 安装后端依赖
echo "[4/5] 安装后端依赖..."
cd oaiss-server && npm install && cd ..

# 5. 安装前端依赖
echo "[5/5] 安装前端依赖..."
cd oaiss && npm install && cd ..

echo "=== 初始化完成 ==="
echo "后端: cd oaiss-server && npm run dev"
echo "前端: cd oaiss && npm run dev"
echo "管理后台: http://localhost:5173"
echo "默认管理员: admin01 / admin123"
```

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

---

## 附录 B：项目文件对照表

| 前端文件 | 功能 | 对应后端 API |
|---------|------|-------------|
| `views/enterprise/CarbonUpload.vue` | 碳排放核算上报 | `POST /emission-reports` |
| `views/auditor/AuditList.vue` | 审核列表 | `GET /audit/tasks` |
| `views/auditor/AuditDetail.vue` | 审核详情+操作 | `POST /audit/tasks/:id/approve` |
| `views/enterprise/TradingMarket.vue` | 双向拍卖交易 | `POST /trading/orders` |
| `views/enterprise/P2POrders.vue` | P2P订单管理 | `GET/POST/DELETE /p2p/orders` |
| `views/enterprise/AccountCenter.vue` | 企业账户中心 | `GET /account` |
| `views/enterprise/CompanyDashboard.vue` | 企业数据仪表盘 | `GET /statistics?type=company` |
| `views/admin/SystemUsers.vue` | 用户管理 | `GET/POST/PUT/DELETE /admin/users` |
| `views/admin/SystemCarbon.vue` | 碳核算管理(admin) | `GET /emission-reports` |
| `views/admin/SystemConfig.vue` | 系统配置 | `GET/PUT /admin/configs` |
| `views/admin/DataStatistics.vue` | 全局数据统计 | `GET /statistics?type=global` |
