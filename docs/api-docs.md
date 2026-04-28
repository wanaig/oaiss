# OAISS Server API 文档

**基础URL:** `http://localhost:3001`

**Content-Type:** `application/json`

---


-- 管理员 admin01 (密码: admin123)

-- 审核员 auditor01 (密码: auditor123)

-- 企业用户 enterprise01 (密码: enterprise123)


## 目录

1. [通用说明](#通用说明)
2. [认证模块](#1-认证模块-auth)
3. [账户模块](#2-账户模块-account)
4. [交易模块](#3-交易模块-trading)
5. [碳排放报告模块](#4-碳排放报告模块-emission-reports)
6. [审计模块](#5-审计模块-audit)
7. [管理员-用户管理](#6-管理员-用户管理-adminusers)
8. [管理员-系统配置](#7-管理员-系统配置-adminconfigs)
9. [管理员-统计信息](#8-统计信息-statistics)
10. [健康检查](#9-健康检查)

---

## 通用说明

### 统一响应格式

所有接口返回统一的 `Result<T>` 格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1714000000000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码（200成功，400参数错误，401未认证，403无权限，404不存在，405方法不允许，500服务器错误） |
| message | string | 提示信息 |
| data | T | 响应数据 |
| timestamp | long | 时间戳 |

### 分页响应格式

分页接口返回 `PageResult<T>` 嵌套在 `data` 中：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [],
    "total": 100,
    "page": 1,
    "size": 10,
    "pages": 10
  },
  "timestamp": 1714000000000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| records | array | 当前页数据列表 |
| total | long | 总记录数 |
| page | int | 当前页码 |
| size | int | 每页大小 |
| pages | int | 总页数 |

### 认证方式

使用 **JWT Bearer Token** 进行身份验证。

- **请求头:** `Authorization: Bearer <token>`
- **Token 有效期:** 24 小时（默认）
- **获取方式:** 调用登录接口 `/api/auth/login`

### 角色权限

| 角色 | 标识 | 说明 |
|------|------|------|
| 企业用户 | `ENTERPRISE` | 可交易、提交碳排放报告 |
| 审计员 | `AUDITOR` | 可审计碳排放报告 |
| 管理员 | `ADMIN` | 系统管理权限 |

---

## 1. 认证模块 (Auth)

**基础路径:** `/api/auth`

---

### 1.1 用户登录

**POST** `/api/auth/login`

- **权限:** 公开

**请求体:**

```json
{
  "username": "admin",
  "password": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": "eyJhbGciOiJIUzI1NiJ9...",
  "timestamp": 1714000000000
}
```

其中 `data` 为 JWT Token 字符串。

---

### 1.2 用户注册

**POST** `/api/auth/register`

- **权限:** 公开

**请求体:**

```json
{
  "username": "enterprise01",
  "password": "pass123",
  "displayName": "企业A",
  "phone": "13800138000",
  "role": "ENTERPRISE",
  "companyId": "COMP001",
  "companyName": "XX碳排放企业",
  "enterpriseType": "manufacturing",
  "deptName": "环保部",
  "deptCode": "HB001"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| displayName | string | 是 | 显示名称 |
| phone | string | 否 | 手机号 |
| role | string | 是 | 角色（ENTERPRISE / AUDITOR / ADMIN） |
| companyId | string | 否 | 企业编号 |
| companyName | string | 否 | 企业名称 |
| enterpriseType | string | 否 | 企业类型 |
| deptName | string | 否 | 部门名称 |
| deptCode | string | 否 | 部门代码 |

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 1.3 获取当前用户信息

**GET** `/api/auth/me`

- **权限:** 任何已认证用户

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "displayName": "管理员",
    "phone": "13800138000",
    "role": "ADMIN",
    "status": 1,
    "creditScore": 100,
    "creditEnabled": true,
    "createTime": "2024-01-01T00:00:00",
    "updateTime": "2024-01-01T00:00:00"
  },
  "timestamp": 1714000000000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 用户ID |
| username | string | 用户名 |
| displayName | string | 显示名称 |
| phone | string | 手机号 |
| role | string | 角色 |
| status | int | 状态（1正常，0禁用） |
| creditScore | int | 信用评分 |
| creditEnabled | boolean | 信用是否启用 |
| createTime | datetime | 创建时间 |
| updateTime | datetime | 更新时间 |

---

## 2. 账户模块 (Account)

**基础路径:** `/api/account`

- **权限:** `ROLE_ENTERPRISE`

---

### 2.1 获取企业账户信息

**GET** `/api/account`

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "companyId": "COMP001",
    "companyName": "XX碳排放企业",
    "enterpriseType": "manufacturing",
    "deptName": "环保部",
    "deptCode": "HB001",
    "funds": 1000000.00,
    "frozenFunds": 50000.00,
    "carbonQuota": 50000,
    "frozenQuota": 5000,
    "availableFunds": 950000.00,
    "availableQuota": 45000
  },
  "timestamp": 1714000000000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| companyId | string | 企业编号 |
| companyName | string | 企业名称 |
| enterpriseType | string | 企业类型 |
| deptName | string | 部门名称 |
| deptCode | string | 部门代码 |
| funds | number | 资金总额 |
| frozenFunds | number | 冻结资金 |
| carbonQuota | number | 碳配额总量 |
| frozenQuota | number | 冻结配额 |
| availableFunds | number | 可用资金 |
| availableQuota | number | 可用配额 |

---

### 2.2 获取交易记录

**GET** `/api/account/transactions`

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "txHash": "0xabc...",
      "blockHash": "0xdef...",
      "blockHeight": 12345,
      "buyOrderId": 1,
      "sellOrderId": 2,
      "buyerId": "COMP001",
      "sellerId": "COMP002",
      "price": 52.50,
      "quantity": 100,
      "totalAmount": 5250.00,
      "dataHash": "hash...",
      "status": "completed",
      "fabricTxId": "fabrictx001",
      "isOnChain": true,
      "createTime": "2024-01-01T00:00:00"
    }
  ],
  "timestamp": 1714000000000
}
```

---

## 3. 交易模块 (Trading)

**基础路径:** `/api/trading`

---

### 3.1 获取订单簿

**GET** `/api/trading/order-book`

- **权限:** `ROLE_ENTERPRISE`, `ROLE_ADMIN`

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| side | string | 否 | 过滤方向：`buy` 买单 / `sell` 卖单 |

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "orderId": 10,
      "companyId": "COMP001",
      "price": 52.50,
      "quantity": 100,
      "side": "sell"
    }
  ],
  "timestamp": 1714000000000
}
```

---

### 3.2 提交订单

**POST** `/api/trading/orders`

- **权限:** 任何已认证用户

**请求体:**

```json
{
  "side": "buy",
  "price": 52.50,
  "quantity": 100
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| side | string | 是 | 方向：`buy`（买入）/ `sell`（卖出） |
| price | number | 是 | 单价 |
| quantity | number | 是 | 数量 |

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 10,
    "companyId": "COMP001",
    "side": "buy",
    "price": 52.50,
    "originalQuantity": 100,
    "quantity": 100,
    "filledQuantity": 0,
    "status": "open",
    "createTime": "2024-01-01T00:00:00"
  },
  "timestamp": 1714000000000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 订单ID |
| companyId | string | 企业编号 |
| side | string | 方向 |
| price | number | 价格 |
| originalQuantity | number | 原始数量 |
| quantity | number | 当前剩余数量 |
| filledQuantity | number | 已成交数量 |
| status | string | 状态：`open` / `filled` / `cancelled` / `partial` |
| createTime | datetime | 创建时间 |

---

### 3.3 撤销订单

**DELETE** `/api/trading/orders/{id}/cancel`

- **权限:** 任何已认证用户

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 订单ID |

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 3.4 获取我的订单列表

**GET** `/api/trading/orders/my`

- **权限:** 任何已认证用户

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| size | int | 否 | 每页条数，默认 10 |

**响应:** 分页格式，`records` 为 `TradingOrder` 数组（字段同提交订单响应）。

---

### 3.5 获取交易记录

**GET** `/api/trading/transactions`

- **权限:** 任何已认证用户

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| size | int | 否 | 每页条数，默认 10 |

**响应:** 分页格式，`records` 为 `TransactionRecord` 数组。

---

### 3.6 获取交易详情

**GET** `/api/trading/transactions/{id}`

- **权限:** 任何已认证用户

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 交易记录ID |

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "txHash": "0xabc...",
    "buyOrderId": 1,
    "sellOrderId": 2,
    "buyerId": "COMP001",
    "sellerId": "COMP002",
    "price": 52.50,
    "quantity": 100,
    "totalAmount": 5250.00,
    "status": "completed",
    "isOnChain": true,
    "createTime": "2024-01-01T00:00:00"
  },
  "timestamp": 1714000000000
}
```

---

### 3.7 获取市场统计

**GET** `/api/trading/stats`

- **权限:** 任何已认证用户

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalVolume": 50000,
    "avgPrice": 51.20,
    "highPrice": 55.00,
    "lowPrice": 48.00,
    "totalTransactions": 120,
    "lastPrice": 52.50
  },
  "timestamp": 1714000000000
}
```

---

## 4. 碳排放报告模块 (Emission Reports)

**基础路径:** `/api/emission-reports`

---

### 4.1 获取报告列表

**GET** `/api/emission-reports`

- **权限:** `ROLE_ENTERPRISE`, `ROLE_ADMIN`, `ROLE_AUDITOR`

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| size | int | 否 | 每页条数，默认 10 |
| auditStatus | string | 否 | 审核状态过滤：`pending` / `approved` / `rejected` |

**响应:** 分页格式，`records` 为报告数组。

报告对象结构：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 报告ID |
| reportNo | string | 报告编号 |
| companyId | string | 企业编号 |
| deptName | string | 部门名称 |
| deptCode | string | 部门代码 |
| enterpriseType | string | 企业类型 |
| coalHeatValue | number | 煤炭热值 |
| coalConsumption | number | 煤炭消耗量 |
| oilHeatValue | number | 油热值 |
| oilConsumption | number | 油消耗量 |
| emission | number | 碳排放量 |
| dataHash | string | 数据哈希 |
| uploaderCode | string | 上传者代码 |
| auditStatus | string | 审核状态：`draft` / `pending` / `approved` / `rejected` |
| signed | boolean | 是否签名 |
| fabricTxId | string | 区块链交易ID |
| createTime | datetime | 创建时间 |
| updateTime | datetime | 更新时间 |

---

### 4.2 获取报告详情

**GET** `/api/emission-reports/{id}`

- **权限:** 任何已认证用户

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 报告ID |

**响应:** 报告对象。

---

### 4.3 创建报告

**POST** `/api/emission-reports`

- **权限:** 任何已认证用户

**请求体:**

```json
{
  "companyId": "COMP001",
  "deptName": "环保部",
  "deptCode": "HB001",
  "enterpriseType": "manufacturing",
  "coalHeatValue": 5500,
  "coalConsumption": 1000,
  "oilHeatValue": 9800,
  "oilConsumption": 500,
  "emission": 12500.50,
  "uploaderCode": "UPLOADER001"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| companyId | string | 是 | 企业编号 |
| deptName | string | 否 | 部门名称 |
| deptCode | string | 否 | 部门代码 |
| enterpriseType | string | 否 | 企业类型 |
| coalHeatValue | number | 否 | 煤炭热值 |
| coalConsumption | number | 否 | 煤炭消耗量 |
| oilHeatValue | number | 否 | 油热值 |
| oilConsumption | number | 否 | 油消耗量 |
| emission | number | 否 | 碳排放量 |
| uploaderCode | string | 否 | 上传者代码 |

**响应:** 创建的报告对象。

---

### 4.4 更新报告

**PUT** `/api/emission-reports/{id}`

- **权限:** 任何已认证用户

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 报告ID |

**请求体:** 同创建报告。

**响应:** 更新后的报告对象。

---

### 4.5 删除报告

**DELETE** `/api/emission-reports/{id}`

- **权限:** 任何已认证用户

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 报告ID |

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 4.6 提交审核

**POST** `/api/emission-reports/{id}/submit`

- **权限:** 任何已认证用户

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 报告ID |

将报告状态从 `draft` 更新为 `pending`，提交等待审计。

**响应:** 更新后的报告对象。

---

### 4.7 获取报告上链数据

**GET** `/api/emission-reports/{id}/onchain`

- **权限:** 任何已认证用户

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 报告ID |

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": "{ \"json\": \"onchain-data...\" }",
  "timestamp": 1714000000000
}
```

---

## 5. 审计模块 (Audit)

**基础路径:** `/api/audit`

- **权限:** `ROLE_AUDITOR`

---

### 5.1 获取审计任务列表

**GET** `/api/audit/tasks`

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| size | int | 否 | 每页条数，默认 10 |
| auditStatus | string | 否 | 审核状态过滤：`pending` |

**响应:** 分页格式，`records` 为 `CarbonEmissionReport` 数组（同报告对象）。

---

### 5.2 获取审计任务详情

**GET** `/api/audit/tasks/{id}`

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 报告ID |

**响应:** 报告对象。

---

### 5.3 审核通过

**POST** `/api/audit/tasks/{id}/approve`

**请求体:**

```json
{
  "auditResult": "approved",
  "pollutionStatus": "low",
  "impactAssessment": "符合标准",
  "emissionLevel": "B",
  "rejectReason": null,
  "auditPassword": "audit_pwd",
  "eventCode": "EVT001"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| auditResult | string | 是 | 审核结果：`approved` / `rejected` |
| pollutionStatus | string | 否 | 污染状况 |
| impactAssessment | string | 否 | 影响评估 |
| emissionLevel | string | 否 | 排放等级 |
| rejectReason | string | 否 | 拒绝原因 |
| auditPassword | string | 否 | 审计密码 |
| eventCode | string | 否 | 事件代码 |

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "reportId": 1,
    "auditorId": 2,
    "auditResult": "approved",
    "pollutionStatus": "low",
    "impactAssessment": "符合标准",
    "emissionLevel": "B",
    "rejectReason": null,
    "fabricTxId": "fabrictx002",
    "createTime": "2024-01-01T00:00:00"
  },
  "timestamp": 1714000000000
}
```

---

### 5.4 审核拒绝

**POST** `/api/audit/tasks/{id}/reject`

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 报告ID |

**请求体:** 同审核通过，但 `auditResult` 应为 `rejected`，并填写 `rejectReason`。

**响应:** 审核记录对象。

---

### 5.5 获取审核记录

**GET** `/api/audit/tasks/{id}/records`

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 报告ID |

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "reportId": 1,
      "auditorId": 2,
      "auditResult": "approved",
      "pollutionStatus": "low",
      "impactAssessment": "符合标准",
      "emissionLevel": "B",
      "rejectReason": null,
      "fabricTxId": "fabrictx002",
      "createTime": "2024-01-01T00:00:00"
    }
  ],
  "timestamp": 1714000000000
}
```

---

## 6. 管理员-用户管理 (Admin/Users)

**基础路径:** `/api/admin/users`

- **权限:** `ROLE_ADMIN`

---

### 6.1 获取用户列表

**GET** `/api/admin/users`

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| size | int | 否 | 每页条数，默认 10 |
| role | string | 否 | 角色过滤：`ENTERPRISE` / `AUDITOR` / `ADMIN` |

**响应:** 分页格式，`records` 为 `SysUser` 数组。

---

### 6.2 获取用户详情

**GET** `/api/admin/users/{id}`

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 用户ID |

**响应:** 用户对象。

---

### 6.3 更新用户

**PUT** `/api/admin/users/{id}`

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 用户ID |

**请求体:** `SysUser` 完整对象。

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": null,
  "timestamp": 1714000000000
}
```

---

### 6.4 删除用户

**DELETE** `/api/admin/users/{id}`

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 用户ID |

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": null,
  "timestamp": 1714000000000
}
```

---

## 7. 管理员-系统配置 (Admin/Configs)

**基础路径:** `/api/admin/configs`

- **权限:** `ROLE_ADMIN`

---

### 7.1 获取配置列表

**GET** `/api/admin/configs`

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "configKey": "carbon_price",
      "configName": "碳价",
      "configValue": "52.50",
      "description": "当前碳交易价格",
      "updatedBy": "admin",
      "updateTime": "2024-01-01T00:00:00"
    }
  ],
  "timestamp": 1714000000000
}
```

---

### 7.2 更新配置

**PUT** `/api/admin/configs/{id}`

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 配置ID |

**请求体:**

```json
{
  "configValue": "55.00"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| configValue | string | 是 | 配置值 |

**响应:** 更新后的配置对象。

---

## 8. 统计信息 (Statistics)

**基础路径:** `/api/statistics`

- **权限:** 任何已认证用户

---

### 8.1 获取聚合统计

**GET** `/api/statistics`

**响应:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalUsers": 50,
    "totalReports": 200,
    "totalTransactions": 150,
    "pendingReports": 10,
    "approvedReports": 180
  },
  "timestamp": 1714000000000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| totalUsers | int | 用户总数 |
| totalReports | int | 报告总数 |
| totalTransactions | int | 交易总数 |
| pendingReports | int | 待审核报告数 |
| approvedReports | int | 已通过报告数 |

---

## 9. 健康检查

### Spring Boot Actuator 健康检查

**GET** `/actuator/health`

- **权限:** 公开

**响应:**

```json
{
  "status": "UP"
}
```

---

## 附录：数据库实体概览

| 表名 | 实体 | 说明 |
|------|------|------|
| `sys_users` | SysUser | 系统用户 |
| `enterprise_accounts` | EnterpriseAccount | 企业账户（资金、配额） |
| `trading_orders` | TradingOrder | 交易订单 |
| `order_book` | OrderBookEntry | 订单簿 |
| `blockchain_transactions` | TransactionRecord | 成交记录 |
| `p2p_orders` | P2POrder | 点对点订单 |
| `carbon_emission_reports` | CarbonEmissionReport | 碳排放报告 |
| `audit_records` | AuditRecord | 审计记录 |
| `system_configs` | SystemConfig | 系统配置 |

---

## 附录：错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证（Token 缺失或无效） |
| 403 | 无权限（角色不符） |
| 404 | 资源不存在 |
| 405 | 请求方法不允许 |
| 500 | 服务器内部错误 |
