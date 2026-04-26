export type CameraProvider = 'rtsp' | 'onvif' | 'homekit' | 'api';

export interface CameraConnectionConfig {
  provider: CameraProvider;
  streamUrl: string;
  label: string;
  secretHint?: string;
}

export interface CameraConnectionHealth {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export interface CameraConnector {
  provider: CameraProvider;
  validateConfig(config: CameraConnectionConfig): CameraConnectionHealth;
}

function validateBasicUrl(config: CameraConnectionConfig): CameraConnectionHealth {
  const value = String(config.streamUrl || '').trim();
  if (!value) return { ok: false, message: 'Stream URL is required' };
  try {
    // Allow rtsp and http(s) endpoints for camera API bridges.
    const parsed = new URL(value.replace(/^rtsp:\/\//, 'http://'));
    if (!parsed.hostname) return { ok: false, message: 'Stream URL host is missing' };
  } catch {
    return { ok: false, message: 'Stream URL format is invalid' };
  }
  return { ok: true, message: 'Configuration looks valid' };
}

class RtspConnector implements CameraConnector {
  provider: CameraProvider = 'rtsp';
  validateConfig(config: CameraConnectionConfig): CameraConnectionHealth {
    const basic = validateBasicUrl(config);
    if (!basic.ok) return basic;
    if (!config.streamUrl.startsWith('rtsp://')) {
      return { ok: false, message: 'RTSP provider requires an rtsp:// URL' };
    }
    return basic;
  }
}

class OnvifConnector implements CameraConnector {
  provider: CameraProvider = 'onvif';
  validateConfig(config: CameraConnectionConfig): CameraConnectionHealth {
    return validateBasicUrl(config);
  }
}

class HomeKitConnector implements CameraConnector {
  provider: CameraProvider = 'homekit';
  validateConfig(config: CameraConnectionConfig): CameraConnectionHealth {
    return validateBasicUrl(config);
  }
}

class ApiConnector implements CameraConnector {
  provider: CameraProvider = 'api';
  validateConfig(config: CameraConnectionConfig): CameraConnectionHealth {
    const basic = validateBasicUrl(config);
    if (!basic.ok) return basic;
    if (!config.streamUrl.startsWith('https://')) {
      return { ok: false, message: 'API provider requires https:// endpoint' };
    }
    return basic;
  }
}

const connectors: Record<CameraProvider, CameraConnector> = {
  rtsp: new RtspConnector(),
  onvif: new OnvifConnector(),
  homekit: new HomeKitConnector(),
  api: new ApiConnector(),
};

export function getCameraConnector(provider: CameraProvider): CameraConnector {
  return connectors[provider];
}
