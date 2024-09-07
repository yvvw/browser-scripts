declare global {
  interface Window {
    __BiliUser__?: IBiliUser
    player?: IBiliPlayer
    livePlayer?: IBiliLivePlayer
  }
}

export declare interface IBiliUser {
  isLogin: boolean
  cache: {
    data: {
      isLogin: boolean
      vipStatus: 0 | 1
    }
  }
}

export declare interface IBiliPlayer {
  getQuality(): { realQ: number }
  getSupportedQualityList(): number[]
  requestQuality(quality: number): void
}

export declare interface IBiliLivePlayer {
  getPlayerInfo(): {
    quality: string
    qualityCandidates: { qn: string }[]
  }
  switchQuality(string): void
}

export {}
