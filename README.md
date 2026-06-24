# 邻里闲置交易平台

小区邻里闲置二手物品交易平台，支持物品发布、搜索筛选、详情查看、收藏、私信沟通以及公开问答评论。

---

## 一、技术栈

| 层 | 技术选型 | 版本 |
|---|---|---|
| **前端框架** | Vue 3 (Composition API) | 3.3.8 |
| **状态管理** | Pinia | 2.1.7 |
| **路由** | Vue Router 4 | 4.2.5 |
| **HTTP 客户端** | Axios | 1.6.2 |
| **构建工具** | Vite | 5.0.0 |
| **后端框架** | Express | 4.18.2 |
| **数据库** | SQLite3 | 5.1.6 |
| **身份认证** | JWT (jsonwebtoken) | 9.0.2 |
| **密码加密** | bcryptjs | 2.4.3 |
| **文件上传** | Multer | 1.4.5-lts.1 |
| **跨域** | CORS | 2.8.5 |

---

## 二、项目目录结构

```
project60/
├── client/                  # 前端 (Vue 3 + Vite)
│   ├── src/
│   │   ├── components/      # 通用组件
│   │   │   └── ItemCard.vue          # 物品卡片组件
│   │   ├── composables/     # 可组合业务逻辑
│   │   │   └── useItemComments.js    # 评论区状态与交互
│   │   ├── router/          # 路由配置
│   │   │   └── index.js
│   │   ├── stores/          # Pinia 状态管理（接口薄封装）
│   │   │   ├── user.js               # 用户/认证相关接口
│   │   │   ├── item.js               # 物品、分类、收藏相关接口
│   │   │   ├── message.js            # 私信相关接口
│   │   │   └── comments.js           # 评论相关接口
│   │   ├── styles/          # 全局样式
│   │   │   └── global.css
│   │   ├── utils/           # 工具函数
│   │   │   ├── request.js            # Axios 实例 + 拦截器
│   │   │   └── helpers.js            # 通用工具（格式化、Toast 等）
│   │   ├── views/           # 页面视图
│   │   │   ├── Home.vue              # 首页（列表 + 搜索 + 筛选）
│   │   │   ├── Login.vue             # 登录页
│   │   │   ├── Register.vue          # 注册页
│   │   │   ├── Publish.vue           # 发布/编辑物品页
│   │   │   ├── ItemDetail.vue        # 物品详情页（含评论区）
│   │   │   ├── MyItems.vue           # 我发布的
│   │   │   ├── Messages.vue          # 会话列表
│   │   │   └── Chat.vue              # 私信聊天页
│   │   ├── App.vue           # 根组件
│   │   └── main.js           # 应用入口
│   ├── index.html
│   ├── vite.config.js        # Vite 配置（端口 5173 + API 代理）
│   └── package.json
│
├── server/                  # 后端 (Express + SQLite)
│   ├── middleware/          # 中间件
│   │   ├── auth.js                   # JWT 认证中间件
│   │   └── upload.js                 # Multer 文件上传中间件
│   ├── routes/              # 路由模块
│   │   ├── users.js                  # 用户模块（注册/登录/资料）
│   │   ├── items.js                  # 物品模块（CRUD/搜索/收藏）
│   │   ├── messages.js               # 私信模块（会话/消息/未读）
│   │   └── comments.js               # 评论模块（楼中楼）
│   ├── data/                # SQLite 数据库文件目录（运行时生成）
│   │   └── neighborhood.db
│   ├── uploads/             # 用户上传图片目录（运行时生成）
│   ├── app.js               # Express 应用入口
│   ├── db.js                # SQLite 数据库初始化 + 建表
│   └── package.json
│
├── package.json             # 根（仅包含 concurrently 与快捷脚本）
└── README.md
```

---

## 三、前端目录说明

### 3.1 `src/stores/` — Pinia 状态层

只做接口薄封装，不包含业务逻辑。所有方法直接返回 Axios Promise。

| 文件 | 主要方法 |
|---|---|
| [user.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/client/src/stores/user.js) | `register` `login` `logout` `getProfile` `getUserById` + 本地 token 持久化 |
| [item.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/client/src/stores/item.js) | `getCategories` `getItems` `getItemDetail` `getMyItems` `getFavorites` `publishItem` `updateItem` `deleteItem` `addFavorite` `removeFavorite` `checkFavorite` |
| [message.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/client/src/stores/message.js) | `getConversations` `getMessages` `sendMessage` `getUnreadCount` |
| [comments.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/client/src/stores/comments.js) | `getComments` `addComment` `deleteComment` `getCommentCount` |

### 3.2 `src/composables/` — 业务逻辑组合函数

| 文件 | 导出内容 |
|---|---|
| [useItemComments.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/client/src/composables/useItemComments.js) | 评论区状态（`comments` `commentsLoading` `newComment` `replyingTo` 等）+ 操作（`fetchComments` `submitComment` `submitReply` `deleteComment` `showReplyInput` `cancelReply` 等） |

### 3.3 `src/utils/`

| 文件 | 功能 |
|---|---|
| [request.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/client/src/utils/request.js) | Axios 实例（`baseURL: '/api'`），请求拦截器自动加 `Bearer` token（无 token 不加），响应拦截器 401 自动注销并跳转登录 |
| [helpers.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/client/src/utils/helpers.js) | `formatPrice` `formatDate` `getCategoryIcon` `showToast` 等工具 |

### 3.4 路由表 ([router/index.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/client/src/router/index.js))

| 路径 | 页面 | 需要登录 |
|---|---|---|
| `/` | Home.vue（首页） | ❌ |
| `/login` | Login.vue | 游客仅能访问 |
| `/register` | Register.vue | 游客仅能访问 |
| `/publish` | Publish.vue | ✅ |
| `/item/:id` | ItemDetail.vue | ❌（游客可浏览） |
| `/my-items` | MyItems.vue | ✅ |
| `/messages` | Messages.vue | ✅ |
| `/messages/:userId` | Chat.vue | ✅ |

---

## 四、后端目录说明

### 4.1 中间件 ([middleware/](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/server/middleware))

| 文件 | 作用 |
|---|---|
| [auth.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/server/middleware/auth.js) | 从 `Authorization: Bearer <token>` 解析 JWT，成功挂载 `req.user`，失败返回 401 |
| [upload.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/server/middleware/upload.js) | Multer 配置：单文件 ≤5MB，仅接受 `jpeg/jpg/png/gif`，文件名 `item-{timestamp}-{rand}.{ext}`，保存到 `server/uploads/` |

### 4.2 数据库表 ([db.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/server/db.js))

#### `categories` — 物品分类

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 自增主键 |
| name | TEXT UNIQUE | 分类名称 |

预置分类：家电、书籍、衣物、数码、家具、运动器材、母婴用品、其他

---

#### `users` — 用户

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 自增主键 |
| username | TEXT UNIQUE | 用户名 |
| password | TEXT | bcrypt 哈希后的密码 |
| nickname | TEXT | 昵称 |
| phone | TEXT | 手机号 |
| avatar | TEXT | 头像 URL |
| created_at | DATETIME | 创建时间（默认 CURRENT_TIMESTAMP） |

---

#### `items` — 物品

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 自增主键 |
| user_id | INTEGER FK → users.id | 发布者 |
| title | TEXT | 标题 |
| description | TEXT | 描述 |
| price | REAL | 价格 |
| category | TEXT | 分类名称 |
| images | TEXT | JSON 字符串数组（图片路径） |
| status | INTEGER | 1=在售，0=已售出/已下架 |
| created_at | DATETIME | 创建时间 |

---

#### `favorites` — 收藏

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 自增主键 |
| user_id | INTEGER FK → users.id | 收藏者 |
| item_id | INTEGER FK → items.id | 物品 |
| created_at | DATETIME | 创建时间 |

> 唯一约束 `UNIQUE(user_id, item_id)`

---

#### `messages` — 私信

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 自增主键 |
| sender_id | INTEGER FK → users.id | 发送者 |
| receiver_id | INTEGER FK → users.id | 接收者 |
| item_id | INTEGER FK → items.id | 关联物品（可空） |
| content | TEXT | 消息内容 |
| is_read | INTEGER | 0=未读，1=已读 |
| created_at | DATETIME | 创建时间 |

---

#### `comments` — 公开评论（楼中楼）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 自增主键 |
| item_id | INTEGER FK → items.id | 关联物品 |
| user_id | INTEGER FK → users.id | 评论者 |
| parent_id | INTEGER | 父评论 ID，0=顶层评论 |
| reply_to_user_id | INTEGER FK → users.id | 被回复用户（可空） |
| content | TEXT | 评论内容 |
| created_at | DATETIME | 创建时间 |

---

## 五、API 接口列表

统一前缀：`/api`，JSON 响应格式：

```json
{ "message": "描述", ...业务字段 }
```

---

### 5.1 用户模块 `/api/users`

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/users/register` | ❌ | 注册账号 |
| POST | `/api/users/login` | ❌ | 登录 |
| GET | `/api/users/profile` | ✅ | 获取当前登录用户资料 |
| GET | `/api/users/:id` | ✅ | 获取指定用户资料 |

**请求/响应示例：**

`POST /api/users/register`
```json
{ "username": "test", "password": "123456", "nickname": "小明", "phone": "13800138000" }
```
→ `{ "token": "jwt...", "user": { "id": 1, "username": "test", "nickname": "小明" } }`

`POST /api/users/login`
```json
{ "username": "test", "password": "123456" }
```
→ `{ "token": "jwt...", "user": { ... } }`

---

### 5.2 物品模块 `/api/items`

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/items/categories` | ❌ | 获取所有分类 |
| GET | `/api/items` | ❌ | 分页列表（支持 query: keyword / category / minPrice / maxPrice / page / pageSize） |
| GET | `/api/items/my` | ✅ | 我发布的物品 |
| GET | `/api/items/favorites` | ✅ | 我的收藏列表 |
| GET | `/api/items/:id` | ❌ | 物品详情 |
| POST | `/api/items` | ✅ | 发布物品（`multipart/form-data`，图片字段 `images`，最多 5 张） |
| PUT | `/api/items/:id` | ✅ | 更新物品（仅本人） |
| DELETE | `/api/items/:id` | ✅ | 删除物品（下架，仅本人） |
| POST | `/api/items/:id/favorite` | ✅ | 收藏物品 |
| DELETE | `/api/items/:id/favorite` | ✅ | 取消收藏 |
| GET | `/api/items/:id/is-favorited` | ✅ | 是否已收藏 |

**列表响应结构：**
```json
{
  "items": [...],
  "pagination": { "page": 1, "pageSize": 10, "total": 100, "totalPages": 10 }
}
```

---

### 5.3 私信模块 `/api/messages`

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/messages/conversations` | ✅ | 会话列表（按对方用户+物品聚合） |
| GET | `/api/messages/:otherUserId` | ✅ | 与指定用户的聊天记录（支持 query: itemId / page / pageSize，拉取后自动标记已读） |
| POST | `/api/messages` | ✅ | 发送消息 |
| GET | `/api/messages/unread/count` | ✅ | 未读消息总数 |

**发送消息请求体：**
```json
{ "receiverId": 2, "itemId": 1, "content": "你好，这个还在吗？" }
```

---

### 5.4 评论模块 `/api/comments`

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/comments/:itemId` | ❌ | 获取某物品评论（嵌套楼中楼，支持 page / pageSize） |
| POST | `/api/comments` | ✅ | 发布评论或回复 |
| DELETE | `/api/comments/:id` | ✅ | 删除本人评论（级联删除子回复） |
| GET | `/api/comments/count/:itemId` | ❌ | 获取评论总数 |

**评论响应结构（嵌套）：**
```json
{
  "comments": [
    {
      "id": 1,
      "user_id": 1,
      "user_name": "卖家",
      "content": "九成新，功能完好",
      "parent_id": 0,
      "created_at": "...",
      "replies": [
        {
          "id": 2,
          "user_id": 2,
          "user_name": "买家",
          "reply_to_user_id": 1,
          "reply_to_name": "卖家",
          "content": "能便宜点吗？",
          "parent_id": 1,
          "created_at": "..."
        }
      ]
    }
  ],
  "pagination": { ... }
}
```

**发布评论/回复请求体：**
```json
// 顶层评论
{ "itemId": 1, "content": "还在吗？" }

// 回复
{ "itemId": 1, "content": "我要了", "parentId": 1, "replyToUserId": 2 }
```

---

### 5.5 健康检查

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/health` | ❌ | 服务健康检查 |

---

## 六、本地启动

### 环境要求

- Node.js ≥ 16
- npm ≥ 8

### 步骤

```bash
# 1. 安装所有依赖
npm run install:all

# 2. 前后端同时启动
npm run dev
```

或分别启动：

```bash
# 后端（Express，端口 3000）
npm run dev:server

# 前端（Vite，端口 5173，代理 /api → :3000）
npm run dev:client
```

### 生产构建

```bash
npm run build:client     # 构建前端到 client/dist
npm run start:server     # 启动后端
```

---

## 七、运行时自动生成目录

| 路径 | 内容 |
|---|---|
| `server/data/neighborhood.db` | SQLite 数据库文件（首次启动自动建表+写入预置分类） |
| `server/uploads/` | 用户上传的物品图片（URL 前缀 `/uploads/`） |

> 两个目录在首次运行时由 [db.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/server/db.js#L5-L8) 和 [app.js](file:///d:/code/ai-prompt/solo-chrome-dev-F12/repos/repo60/project60/server/app.js#L15-L23) 自动创建，无需手动建。

---

## 八、权限分层设计

| 操作 | 游客 | 登录用户 | 资源所有者 |
|---|---|---|---|
| 浏览物品列表/详情 | ✅ | ✅ | ✅ |
| 浏览评论区 | ✅ | ✅ | ✅ |
| 注册/登录 | ✅ | — | — |
| 发布物品/评论/回复/私信 | ❌ | ✅ | ✅ |
| 收藏/取消收藏 | ❌ | ✅ | — |
| 编辑/删除自己的物品 | ❌ | ❌ | ✅ |
| 删除自己的评论 | ❌ | ❌ | ✅ |

后端强制通过 JWT 中间件拦截写操作，前端再做软校验引导跳转登录页。
