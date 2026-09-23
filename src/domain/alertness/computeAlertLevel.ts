import { AlertLevel } from '../../models';
import { AlertnessConfig } from './config';

// Section 30 score bands.
export function computeAlertLevel(score: number): AlertLevel {
  const { normalMin, noticeMin, warningMin } = AlertnessConfig.levelThresholds;
  if (score >= normalMin) {
    return AlertLevel.NORMAL;
  }
  if (score >= noticeMin) {
    return AlertLevel.NOTICE;
  }
  if (score >= warningMin) {
    return AlertLevel.WARNING;
  }
  return AlertLevel.STOP_RECOMMENDED;
}

export function alertSeverityRank(level: AlertLevel): number {
  switch (level) {
    case AlertLevel.NORMAL:
      return 0;
    case AlertLevel.NOTICE:
      return 1;
    case AlertLevel.WARNING:
      return 2;
    case AlertLevel.STOP_RECOMMENDED:
      return 3;
  }
}

// Section 37 timeline labels — short form of the alert copy.
export function alertShortLabel(level: AlertLevel): string {
  switch (level) {
    case AlertLevel.NOTICE:
      return 'Uống chậm';
    case AlertLevel.WARNING:
      return 'Nghỉ uống';
    case AlertLevel.STOP_RECOMMENDED:
      return 'Nên dừng uống';
    case AlertLevel.NORMAL:
      return 'Ổn định';
  }
}

// Section 30 copy.
export function alertMessage(level: AlertLevel): string {
  switch (level) {
    case AlertLevel.NOTICE:
      return 'Mức tỉnh táo của bạn đang bắt đầu giảm. Hãy uống chậm lại và uống thêm nước.';
    case AlertLevel.WARNING:
      return 'Mức tỉnh táo của bạn đang giảm đáng kể. Hãy nghỉ sử dụng đồ uống có cồn một lúc.';
    case AlertLevel.STOP_RECOMMENDED:
      return 'Mức tỉnh táo của bạn đang giảm đáng kể so với trạng thái bình thường. Hãy ngừng sử dụng rượu bia, uống nước và nghỉ ngơi.';
    case AlertLevel.NORMAL:
      return '';
  }
}
