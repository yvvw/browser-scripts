import '@violentmonkey/types'

declare global {
  interface ILivePlayer {
    getPlayerInfo(): {
      quality: string
      qualityCandidates: { qn: string }[]
    }
    switchQuality(string): void
  }

  interface Window {
    livePlayer?: ILivePlayer
    top?: { livePlayer?: ILivePlayer }
  }
}
