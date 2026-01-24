CREATE TABLE IF NOT EXISTS notification_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fcm_token VARCHAR(512) NOT NULL,
  environment ENUM('DEV','PROD') NOT NULL,
  system_enabled TINYINT(1) NOT NULL DEFAULT 0,
  app_enabled TINYINT(1) NOT NULL DEFAULT 0,
  active_for_important_alerts TINYINT(1) NOT NULL DEFAULT 0,
  platform VARCHAR(32) NOT NULL,
  device_name VARCHAR(128) NULL,
  app_version VARCHAR(32) NULL,
  build_number VARCHAR(32) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_notification_token_env (fcm_token, environment),
  KEY idx_notification_tokens_active_env (environment, active_for_important_alerts),
  KEY idx_notification_tokens_platform (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
