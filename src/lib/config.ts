// src/lib/config.ts
import { env as publicEnv } from '$env/dynamic/public';

export const API_BASE_URL = publicEnv.PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
export const STORAGE_BASE_URL =
	publicEnv.PUBLIC_STORAGE_BASE_URL || 'http://localhost:8000/storage';
