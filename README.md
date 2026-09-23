# Soul Alcohol

Ứng dụng mobile (Android + iOS) theo dõi sự thay đổi **mức độ tỉnh táo** của
chính người dùng qua giọng nói và chuyển động, so sánh với baseline cá nhân
của họ, và cảnh báo sớm khi có dấu hiệu suy giảm.

**Nguyên tắc cốt lõi:** app không đo nồng độ cồn, không kết luận "bạn đang
say". App chỉ trả lời một câu hỏi duy nhất — *trạng thái giọng nói/vận động
hiện tại đang khác bao nhiêu so với chính bạn lúc tỉnh táo* — rồi đưa cảnh
báo phù hợp (uống chậm lại → nên nghỉ → nên dừng).

01 người dùng / 01 thiết bị, xử lý và lưu trữ hoàn toàn offline trên máy.
Không backend, không cloud, không tài khoản.

---

## Tech stack

| Layer | Công nghệ |
|---|---|
| App | React Native + TypeScript (strict) |
| Android native | Kotlin (AudioRecord, SensorManager, Foreground Service) |
| iOS native | Swift (AVAudioEngine, Core Motion) |
| Local DB | SQLite (`@op-engineering/op-sqlite`, hỗ trợ SQLCipher) |
| AI (kế hoạch) | PyTorch (train, ngoài repo) → ONNX → ONNX Runtime Mobile |
| Navigation | React Navigation (native-stack) |
| Test | Jest + ts-jest preset của React Native |

---

## Cấu trúc dự án

```text
src/
  app/                  Theme (light/dark), ThemeProvider, bootstrap logic khi mở app
  navigation/            RootNavigator + type cho toàn bộ route (RootStackParamList)
  screens/                UI theo từng nhóm màn hình, 1 thư mục = 1 luồng
    onboarding/           4 màn giới thiệu
    baseline/             Voice/Motion Baseline setup + màn trạng thái cá nhân
    home/                 Trang chủ
    monitoring/            Xác nhận bắt đầu, màn hình theo dõi, tóm tắt phiên
    alerts/                Màn cảnh báo (modal)
    history/               Danh sách lịch sử + chi tiết phiên
    settings/               Quyền, xóa dữ liệu
  components/             UI dùng chung: AppText, AppButton, Card, StatusBadge, ScoreChart...
  domain/                  Logic nghiệp vụ thuần (không phụ thuộc React Native)
    session/                SessionManager (state machine) + useMonitoringSession
    baseline/                Speaker enrollment, trích xuất feature giọng nói (mock)
    alertness/               AlertnessConfig, tính điểm, trend, cooldown, Mock Alertness Engine
    alerts/                  (dự phòng mở rộng logic cảnh báo)
  services/                Adapter tới nguồn dữ liệu thô — mock trước, native sau
    audio/                   MockVoiceCaptureService (đang dùng) + NativeMicrophoneBridge (chưa build)
    motion/                  MockMotionCaptureService (đang dùng) + NativeMotionBridge (chưa build)
    ai/                       ModelManager — khung load/inference ONNX (chưa có model thật)
    notification/             (để trống, dự phòng)
  repositories/            CRUD SQLite, map row (snake_case) ↔ domain model (camelCase)
  database/                 schema.ts (DDL), migrations.ts, db.ts (connection), wipeAllData/wipeHistory
  models/                  Domain type/enum dùng chung toàn app (TypeScript, không any)
  config/                  DEV_SIMULATION_MODE và các hằng số cấu hình dev
  hooks/, store/, utils/    Tiện ích dùng chung (format, id generator...)

android/app/src/main/java/com/soulalcohol/
  nativemonitoring/         MotionModule.kt, MicrophoneModule.kt, MonitoringForegroundService.kt

ios/NativeMonitoring/       MotionModule.swift, MicrophoneModule.swift + bridge .m
                            (chưa được thêm vào Xcode target — xem README trong thư mục này)

assets/models/              Nơi đặt file .onnx đã train (hiện đang trống)
Document/                   Tài liệu thiết kế gốc (Soul-Alcohol.docx)
```

**Nguyên tắc phân lớp:** UI (`screens/`) không chứa logic nghiệp vụ — mọi
tính toán/state machine nằm ở `domain/`; `services/` chỉ là nguồn dữ liệu
thô (mock hoặc native) và có thể hoán đổi cho nhau mà không sửa `domain/`
hay `screens/`.

---

## Trạng thái hiện tại

| Phần | Trạng thái |
|---|---|
| UI + navigation (toàn bộ luồng Section 5→41 của tài liệu thiết kế) | ✅ Chạy được, đã qua `tsc`/`eslint`/`jest` |
| SQLite (schema, migration, repository) | ✅ Đã qua type-check, chưa test trên thiết bị thật |
| Session Manager, Mock Alertness Engine, Alert Cooldown | ✅ Có unit test, demo được toàn bộ luồng cảnh báo qua `DEV_SIMULATION_MODE` |
| Native Android (Kotlin: mic, sensor, foreground service) | ⚠️ Đã viết theo kiến trúc, **chưa build** (máy dev không có Android SDK) |
| Native iOS (Swift: mic, Core Motion) | ⚠️ Đã viết theo kiến trúc, **chưa thêm vào Xcode target / chưa build** (cần macOS) |
| ONNX model thật | ❌ Chưa có — `ModelManager` chỉ là khung, báo lỗi rõ ràng khi model chưa tồn tại |

App chạy demo đầy đủ end-to-end ngay bây giờ nhờ `DEV_SIMULATION_MODE`
(`src/config/devSimulation.ts`) — không phụ thuộc phần native/AI chưa build.

---

## Chạy dự án

```sh
npm install
npm start          # Metro dev server

npm run android     # cần Android SDK + emulator/thiết bị
npm run ios          # cần macOS + Xcode + `bundle exec pod install` trước
```

Kiểm tra trước khi commit:

```sh
npx tsc --noEmit
npx eslint . --ext .ts,.tsx
npx jest
```

---

## Cài lên điện thoại thật

### Android

1. Trên điện thoại: **Cài đặt → Giới thiệu về điện thoại → bấm liên tục vào
   "Số bản dựng"** cho tới khi mở khóa **Tùy chọn nhà phát triển**, sau đó
   vào **Tùy chọn nhà phát triển** bật **Gỡ lỗi USB (USB debugging)**.
2. Cắm điện thoại vào máy tính bằng cáp USB, chọn chế độ **Truyền file
   (File transfer/MTP)** nếu được hỏi, và bấm **Cho phép** khi điện thoại
   hỏi tin cậy máy tính này.
3. Kiểm tra máy tính đã nhận thiết bị (cần Android SDK/`adb`, đi kèm khi
   cài Android Studio):
   ```sh
   adb devices
   ```
   Thấy thiết bị hiện ra với trạng thái `device` (không phải `unauthorized`)
   là được.
4. Build và cài thẳng qua Metro (bản debug, có Fast Refresh):
   ```sh
   npm run android
   ```
   Lệnh này tự build APK debug và cài lên điện thoại đang cắm.
5. **Cách khác — build file APK để cài thủ công** (không cần giữ máy tính
   cắm mãi):
   ```sh
   cd android
   ./gradlew assembleDebug
   ```
   File APK nằm ở `android/app/build/outputs/apk/debug/app-debug.apk`, kéo
   vào điện thoại rồi mở để cài (điện thoại sẽ hỏi cho phép cài từ nguồn
   ngoài Play Store — đồng ý cho lần cài này).

### iOS

Chỉ có thể cài lên iPhone thật khi có **máy Mac + Xcode** (Windows không
làm được bước này):

1. `cd ios && bundle install && bundle exec pod install`
2. Mở `ios/SoulAlcohol.xcworkspace` bằng Xcode (không mở file `.xcodeproj`).
3. Cắm iPhone vào Mac, chọn thiết bị đó ở thanh chọn scheme phía trên.
4. Vào tab **Signing & Capabilities** của target `SoulAlcohol`, chọn Apple
   ID/Team cá nhân (miễn phí vẫn cài thử được, nhưng app tự gỡ sau ~7 ngày
   và cần cài lại).
5. Bấm nút **Run** (▶) trong Xcode để build và cài lên máy.
6. Lần đầu mở app trên iPhone, vào **Cài đặt → Cài đặt chung → VPN & Quản
   lý thiết bị**, tin cậy profile developer vừa cài thì app mới mở được.

> Lưu ý: 2 file native module (`MotionModule.swift`, `MicrophoneModule.swift`)
> trong `ios/NativeMonitoring/` chưa được thêm vào Xcode target — cần làm
> theo [ios/NativeMonitoring/README.md](ios/NativeMonitoring/README.md)
> trước khi build, nếu không app vẫn chạy được nhưng thiếu mic/cảm biến
> thật (vẫn hoạt động bằng `DEV_SIMULATION_MODE`).
