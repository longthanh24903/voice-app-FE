# 🚨 Xử lý Lỗi ElevenLabs API - Error Handling

## 📋 Tổng quan

Đã cải thiện hệ thống xử lý lỗi cho ElevenLabs API để cung cấp thông báo lỗi rõ ràng và hướng dẫn khắc phục cho người dùng.

## 🔍 Phân tích Lỗi

### **Lỗi gốc từ curl request:**

```bash
curl 'https://api.elevenlabs.io/v1/text-to-speech/d5HVupAWCwe4e6GvMCAL' \
  -H 'xi-api-key: sk_5981a94ffcd2f25dde914cd47b50dd4d902467fc6fce1a5c' \
  --data-raw '{"text":"...","model_id":"eleven_multilingual_v2","voice_settings":{"stability":0.8,"similarity_boost":0.8}}'
```

### **Response lỗi:**

```json
{
  "detail": {
    "status": "voice_limit_reached",
    "message": "You have reached your maximum amount of custom voices (3 / 3). You can upgrade your subscription to increase your custom voice limit."
  }
}
```

### **Nguyên nhân:**

- **Voice ID**: `d5HVupAWCwe4e6GvMCAL` là custom voice
- **Giới hạn**: Đã đạt tối đa 3/3 custom voices
- **Giải pháp**: Cần nâng cấp subscription hoặc sử dụng voice khác

## ✨ Cải tiến Error Handling

### **1. Specific Error Messages**

```javascript
// Handle specific error cases
if (errorBody.detail && errorBody.detail.status === "voice_limit_reached") {
  errorMessage =
    "Voice limit reached. You have reached your maximum amount of custom voices. Please upgrade your subscription or use a different voice.";
} else if (
  errorBody.detail &&
  errorBody.detail.status === "character_limit_reached"
) {
  errorMessage =
    "Character limit reached. You have used all your available characters for this month.";
} else if (response.status === 422) {
  errorMessage =
    "Invalid request parameters. Please check your voice settings and model selection.";
}
```

### **2. Multilingual Support**

```javascript
// English
errorVoiceLimit: "Voice limit reached. You have reached your maximum amount of custom voices. Please upgrade your subscription or use a different voice.",
errorCharacterLimit: "Character limit reached. You have used all your available characters for this month.",
errorInvalidParams: "Invalid request parameters. Please check your voice settings and model selection.",

// Vietnamese
errorVoiceLimit: "Đã đạt giới hạn voice. Bạn đã đạt số lượng custom voice tối đa. Vui lòng nâng cấp gói đăng ký hoặc sử dụng voice khác.",
errorCharacterLimit: "Đã đạt giới hạn ký tự. Bạn đã sử dụng hết số ký tự có sẵn trong tháng này.",
errorInvalidParams: "Tham số yêu cầu không hợp lệ. Vui lòng kiểm tra cài đặt voice và lựa chọn model.",
```

## 🎯 Các Loại Lỗi Được Xử Lý

### **1. Voice Limit Reached**

- **Status**: `voice_limit_reached`
- **Nguyên nhân**: Đạt giới hạn custom voices
- **Giải pháp**: Nâng cấp subscription hoặc dùng voice khác

### **2. Character Limit Reached**

- **Status**: `character_limit_reached`
- **Nguyên nhân**: Hết quota ký tự trong tháng
- **Giải pháp**: Đợi reset tháng sau hoặc nâng cấp

### **3. Invalid Parameters**

- **Status**: `422`
- **Nguyên nhân**: Tham số không hợp lệ
- **Giải pháp**: Kiểm tra voice settings và model

### **4. Invalid API Key**

- **Status**: `401`
- **Nguyên nhân**: API key không hợp lệ
- **Giải pháp**: Kiểm tra và cập nhật API key

## 🔧 Technical Implementation

### **Files Modified**

#### **1. elevenLabsService.ts**

```javascript
// Enhanced error handling
if (!response.ok) {
  if (response.status === 401) {
    throw new Error("Invalid API Key.");
  }
  let errorMessage = `API Error: ${response.status} ${response.statusText}`;
  try {
    const errorBody = await response.json();
    if (errorBody.detail && errorBody.detail.message) {
      errorMessage = errorBody.detail.message;
    } else if (errorBody.detail) {
      errorMessage = JSON.stringify(errorBody.detail);
    }

    // Handle specific error cases
    if (errorBody.detail && errorBody.detail.status === "voice_limit_reached") {
      errorMessage =
        "Voice limit reached. You have reached your maximum amount of custom voices. Please upgrade your subscription or use a different voice.";
    } else if (
      errorBody.detail &&
      errorBody.detail.status === "character_limit_reached"
    ) {
      errorMessage =
        "Character limit reached. You have used all your available characters for this month.";
    } else if (response.status === 422) {
      errorMessage =
        "Invalid request parameters. Please check your voice settings and model selection.";
    }
  } catch (e) {
    // Could not parse JSON, use the default error message
  }
  throw new Error(errorMessage);
}
```

#### **2. translations.ts**

```javascript
// New error message keys
errorVoiceLimit: "Voice limit reached...",
errorCharacterLimit: "Character limit reached...",
errorInvalidParams: "Invalid request parameters...",
```

## 🚀 Giải pháp cho Lỗi Hiện tại

### **1. Sử dụng Voice ID khác**

```bash
# Voice ID hoạt động tốt
curl 'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM' \
  -H 'xi-api-key: sk_5981a94ffcd2f25dde914cd47b50dd4d902467fc6fce1a5c' \
  --data-raw '{"text":"Test text","model_id":"eleven_multilingual_v2","voice_settings":{"stability":0.8,"similarity_boost":0.8}}'
```

### **2. Kiểm tra Voice Type**

- **Custom Voice**: Có giới hạn số lượng
- **Default Voice**: Không có giới hạn
- **Premium Voice**: Cần subscription phù hợp

### **3. Upgrade Subscription**

- **Free**: 3 custom voices
- **Starter**: 10 custom voices
- **Creator**: 30 custom voices
- **Pro**: 160 custom voices

## 📊 Voice ID Reference

### **Default Voices (Không giới hạn)**

- `21m00Tcm4TlvDq8ikWAM` - Rachel (Female)
- `AZnzlk1XvdvUeBnXmlld` - Domi (Female)
- `EXAVITQu4vr4xnSDxMaL` - Bella (Female)
- `ErXwobaYiN019PkySvjV` - Antoni (Male)
- `MF3mGyEYCl7XYWbV9V6O` - Elli (Female)
- `TxGEqnHWrfWFTfGW9XjX` - Josh (Male)
- `VR6AewLTigWG4xSOukaG` - Arnold (Male)
- `pNInz6obpgDQGcFmaJgB` - Adam (Male)
- `yoZ06aMxZJJ28mfd3POQ` - Sam (Male)

### **Custom Voices (Có giới hạn)**

- `d5HVupAWCwe4e6GvMCAL` - Custom voice (đã đạt giới hạn)

## 🎯 Best Practices

### **1. Voice Selection**

- Sử dụng default voices khi có thể
- Chỉ tạo custom voices khi cần thiết
- Kiểm tra giới hạn trước khi tạo

### **2. Error Handling**

- Luôn kiểm tra response status
- Hiển thị thông báo lỗi rõ ràng
- Cung cấp hướng dẫn khắc phục

### **3. User Experience**

- Thông báo lỗi bằng ngôn ngữ người dùng
- Gợi ý giải pháp cụ thể
- Fallback options khi có lỗi

## 🔄 Workflow với Error Handling

### **1. Voice Selection**

```
Chọn Voice → Kiểm tra Type → Validate → Generate
```

### **2. Error Recovery**

```
Lỗi → Hiển thị Message → Gợi ý Solution → Retry
```

### **3. Fallback Strategy**

```
Custom Voice Error → Switch to Default → Continue
```

---

**🎉 Error handling đã được cải thiện!**

Người dùng sẽ nhận được thông báo lỗi rõ ràng và hướng dẫn khắc phục cụ thể cho từng loại lỗi ElevenLabs API.
