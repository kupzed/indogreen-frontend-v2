// src/lib/config.ts
import { env as publicEnv } from '$env/dynamic/public';

export const API_BASE_URL = publicEnv.PUBLIC_API_BASE || 'http://127.0.0.1:8001/api';
export const STORAGE_BASE_URL = publicEnv.PUBLIC_STORAGE_BASE || 'http://127.0.0.1:8001/storage';
