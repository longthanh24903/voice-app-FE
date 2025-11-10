# Giải thích Cơ chế Proxy Rotation

## Tổng quan

Dự án này sử dụng kiến trúc **client-server** để thực hiện proxy rotation:
- **Frontend (React)**: Quản lý UI và cấu hình proxy
- **Backend Proxy Server**: Xử lý logic xoay proxy thực tế

## Kiến trúc hệ thống

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend      │         │  Proxy Server    │         │  ElevenLabs API │
│   (React App)   │────────▶│   (Backend)      │────────▶│                 │
│                 │         │                  │         │                 │
│ - Quản lý proxy │         │ - Xoay proxy     │         │ - API endpoint  │
│ - UI Settings   │         │ - Forward request│         │                 │
│ - Logs          │         │ - Health check   │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Luồng hoạt động chi tiết

### 1. Quản lý Proxy List (Frontend)

**File: `services/proxyManager.ts`**

- **Lưu trữ**: Proxy được lưu trong `localStorage` với key `elevenlabs_proxy_list`
- **Format proxy**: 
  - `ip:port:user:pass` (ví dụ: `142.111.48.253:7030:user:pass`)
  - `http://user:pass@ip:port` (ví dụ: `http://user:pass@142.111.48.253:7030`)

**Các hàm chính**:
```typescript
// Lưu proxy vào localStorage
saveProxiesToStorage(proxies: ProxyItem[])

// Đọc proxy từ localStorage
loadProxiesFromStorage(): ProxyItem[]

// Đồng bộ proxy lên backend server
syncProxiesToBackend(proxies: ProxyItem[], serverUrl: string)
```

### 2. Proxy Service (Frontend)

**File: `services/proxyService.ts`**

**Class `ProxyService`**:
- Quản lý cấu hình proxy server URL
- Xử lý request/response qua proxy
- Logging các hoạt động

**Các method chính**:
```typescript
// Gửi request qua proxy server
async makeRequest(request: ProxyRequest): Promise<ProxyResponse>

// Kiểm tra health của proxy server
async checkHealth(): Promise<{ status: string; proxies: number; uptime: number }>
```

**Luồng request**:
1. Frontend gọi `proxyService.makeRequest()`
2. Request được gửi đến `${proxyServerUrl}/api/proxy-request` (POST)
3. Backend nhận request, chọn proxy từ danh sách, và forward đến ElevenLabs API
4. Backend trả response về frontend
5. Frontend xử lý response (JSON, audio blob, etc.)

### 3. Tích hợp với ElevenLabs Service

**File: `services/elevenLabsService.ts`**

Khi `proxyEnabled = true`, các API call sẽ đi qua proxy:

```typescript
if (proxyEnabled) {
  // Sử dụng proxy
  const proxyResponse = await proxyService.makeRequest({
    url: apiEndpoint,
    method: "POST",
    headers,
    body: JSON.parse(body),
  });
  // Xử lý response...
} else {
  // Direct fetch (không qua proxy)
  response = await fetch(apiEndpoint, { ... });
}
```

**Các API được hỗ trợ proxy**:
- `generateSpeech()` - Tạo audio từ text
- `getUserInfo()` - Lấy thông tin user
- `getVoices()` - Lấy danh sách voices

### 4. UI Components

**File: `components/ProxySettings.tsx`**

**Tính năng**:
1. **Bật/Tắt proxy**: Toggle để enable/disable proxy rotation
2. **Cấu hình Proxy Server URL**: Địa chỉ backend proxy server (mặc định: `http://localhost:3000`)
3. **Forward Secret**: Secret key để xác thực với backend (header `x-forward-secret`)
4. **Quản lý Proxy List**:
   - Thêm proxy đơn lẻ
   - Import bulk từ text area
   - Import từ file `.txt`
   - Xóa proxy
5. **Health Check**: Kiểm tra trạng thái proxy server (`/health` endpoint)
6. **Proxy Logs**: Hiển thị logs của các request (update mỗi 500ms)

### 5. Backend Proxy Server (Không có trong repo này)

Backend server cần implement các endpoints:

#### a. `POST /api/proxy-request`
- Nhận request từ frontend
- Chọn proxy từ danh sách (rotation logic)
- Forward request đến ElevenLabs API qua proxy đã chọn
- Trả response về frontend

**Request body**:
```json
{
  "url": "https://api.elevenlabs.io/v1/text-to-speech/voice-id",
  "method": "POST",
  "headers": {
    "xi-api-key": "...",
    "Content-Type": "application/json"
  },
  "body": { ... }
}
```

**Headers**:
- `x-forward-secret`: Secret key (nếu được cấu hình)

#### b. `POST /api/proxies`
- Nhận danh sách proxy từ frontend
- Lưu vào file `proxies.txt` hoặc database
- Sử dụng cho rotation

**Request body**:
```json
{
  "proxies": "ip:port:user:pass\nip2:port2:user2:pass2\n..."
}
```

#### c. `GET /health`
- Kiểm tra trạng thái server
- Trả về số lượng proxy available
- Uptime của server

**Response**:
```json
{
  "status": "ok",
  "proxies": 10,
  "uptime": 3600
}
```

## Cơ chế Rotation (Backend)

**Lưu ý**: Logic rotation được thực hiện ở backend server, không có trong frontend code này.

Các chiến lược rotation phổ biến:
1. **Round-robin**: Xoay tuần tự qua danh sách proxy
2. **Random**: Chọn ngẫu nhiên proxy từ danh sách
3. **Least used**: Chọn proxy ít được sử dụng nhất
4. **Health-based**: Chọn proxy đang hoạt động tốt

## Cấu hình

### Environment Variables
```env
VITE_PROXY_SERVER_URL=http://localhost:3000
VITE_PROXY_SECRET=your-secret-key
```

### LocalStorage Keys
- `elevenlabs_proxy_list`: Danh sách proxy
- `elevenlabs_proxy_server_url`: URL của proxy server
- `elevenlabs_proxy_secret`: Secret key
- `elevenlabs_proxy_enabled`: Trạng thái bật/tắt proxy

## Logging

Frontend log các sự kiện:
- **request**: Khi gửi request
- **success**: Khi request thành công
- **error**: Khi request thất bại
- **retry**: Khi retry request (nếu có)

Logs được lưu trong `ProxyService` và hiển thị trong UI với auto-scroll.

## Lưu ý quan trọng

1. **Backend Server**: Backend proxy server không có trong repo này. Cần implement riêng hoặc sử dụng server có sẵn.

2. **Sync Proxies**: Function `syncProxiesToBackend()` được định nghĩa nhưng có thể không được gọi tự động. Cần thêm logic để sync khi proxy list thay đổi.

3. **Security**: Forward secret được sử dụng để xác thực với backend, đảm bảo chỉ authorized client mới có thể sử dụng proxy server.

4. **Error Handling**: Frontend xử lý lỗi và hiển thị trong logs, nhưng không có retry logic tự động ở frontend level.

## Ví dụ sử dụng

1. **Bật proxy rotation**:
   - Vào Settings → Proxy Settings
   - Bật toggle "Proxy Rotation"
   - Nhập Proxy Server URL
   - Nhập Forward Secret (nếu cần)

2. **Thêm proxy**:
   - Nhập proxy vào input: `142.111.48.253:7030:user:pass`
   - Click "Add Proxy"
   - Hoặc import bulk từ text area/file

3. **Kiểm tra health**:
   - Click "Check Health" để kiểm tra số lượng proxy available

4. **Xem logs**:
   - Logs tự động hiển thị khi có request
   - Có thể clear logs bằng nút "Clear Logs"

