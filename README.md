# MQ Monitor for Genesys CTI System

## 개요
이 프로젝트는 Genesys CTI 솔루션의 Tserver 이벤트를 MQ를 통해 모니터링하는 시스템입니다.

## 주요 기능
- MQTT 브로커 연결 및 이벤트 구독
- StationEvent와 AgentStatus 이벤트 실시간 모니터링
- WebSocket을 통한 실시간 웹 인터페이스
- 이벤트 로깅 및 히스토리 관리

## 설정
MQ 연결 정보는 `/apps/APP/conf/ivr.ini` 파일의 [MQ] 섹션에서 읽어옵니다:
- URL: MQTT 브로커 주소
- PORT: MQTT 브로커 포트
- USER: 인증 사용자명
- PASSWORD: 인증 비밀번호

## 설치 및 실행

### 개발 모드
```bash
cd /apps/APP/mq-mon
./start-dev.sh
```

### 프로덕션 모드
```bash
cd /apps/APP/mq-mon
./start.sh
```

### 수동 실행
```bash
# 의존성 설치
npm install

# TypeScript 빌드
npm run build

# 개발 모드 실행 (자동 재시작)
npm run start:dev

# 프로덕션 모드 실행
npm run start:prod
```

## 웹 인터페이스 접속
브라우저에서 http://localhost:5002 접속

## 로그 확인
로그는 `/apps/APP/mq-mon/logs` 디렉토리에 일별로 저장됩니다.

## 구조
- `src/` - TypeScript 소스 코드
  - `config/` - 설정 관리
  - `mq/` - MQTT 연결 및 이벤트 처리
  - `websocket/` - WebSocket 게이트웨이
  - `logger/` - Winston 로깅
- `public/` - 웹 인터페이스 (HTML/JS)
- `logs/` - 로그 파일

## API Endpoints
- WebSocket Endpoint: `ws://localhost:5002/events`

## WebSocket 이벤트
- `mqEvent` - 모든 MQ 이벤트
- `stationEvent` - 내선 이벤트
- `agentStatus` - 상담사 상태 이벤트
- `history` - 이벤트 히스토리
- `status` - 서버 상태 정보