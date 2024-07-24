declare global {
  interface Window {
    __BiliUser__?: IBiliUser
    __LIVE_USER_LOGIN_STATUS__?: IBiliLiveUser
    player?: IBiliPlayer
    livePlayer?: IBiliLivePlayer
  }
}

declare interface IBiliUser {
  isLogin: boolean
  cache: {
    data: IBiliUserLoginData | IBiliUserUnloginData
  }
}

declare interface IBiliUserUnloginData {}

export declare interface IBiliUserLoginData {
  isLogin: boolean
  vipStatus: 0 | 1
}

export declare interface IBiliPlayer {
  getQuality(): { realQ: number }
  getSupportedQualityList(): number[]
  requestQuality(quality: number): void
}

declare interface IBiliLiveUser {
  isLogin: boolean
}

export declare interface IBiliLivePlayer {
  getPlayerInfo(): {
    quality: string
    qualityCandidates: { qn: string }[]
  }
  switchQuality(string): void
}

export {}
