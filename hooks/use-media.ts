import * as React from "react"

export const useMedia = (mediaQuery: string, initialValue?: boolean) => {
  const [isVerified, setIsVerified] = React.useState<boolean | undefined>(
    initialValue
  )

  React.useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      console.warn("matchMedia is not supported by your current browser")
      return
    }
    const mediaQueryList = window.matchMedia(mediaQuery)
    const changeHandler = () => setIsVerified(!!mediaQueryList.matches)

    changeHandler()
    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", changeHandler)
      return () => {
        mediaQueryList.removeEventListener("change", changeHandler)
      }
    }
    if (typeof mediaQueryList.addListener === "function") {
      mediaQueryList.addListener(changeHandler)
      return () => {
        mediaQueryList.removeListener(changeHandler)
      }
    }
    return undefined
  }, [mediaQuery])

  return isVerified
}
