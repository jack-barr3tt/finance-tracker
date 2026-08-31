import { Button } from "flowbite-react"
import { useEffect, useRef, useState, type MouseEvent } from "react"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { usePrivacy } from "../Hooks/usePrivacy"

const HOLD_MS = 500
const RING_SIZE = 32
const RING_STROKE = 2.5
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export default function PrivacyToggleButton() {
  const { shaded, hide, reveal } = usePrivacy()
  const timerRef = useRef<number | null>(null)
  const [holding, setHolding] = useState(false)
  const [armed, setArmed] = useState(false)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setHolding(false)
  }

  useEffect(() => {
    if (!holding) {
      setArmed(false)
      return
    }
    const frame = requestAnimationFrame(() => setArmed(true))
    return () => cancelAnimationFrame(frame)
  }, [holding])

  const label = shaded ? "Hold to show amounts" : "Hide amounts"

  return (
    <Button
      color="light"
      className="relative size-10 p-0 shrink-0 select-none"
      title={label}
      aria-label={label}
      aria-pressed={!shaded}
      onContextMenu={(event: MouseEvent) => event.preventDefault()}
      onPointerDown={() => {
        if (!shaded) {
          hide()
          return
        }
        clearTimer()
        setHolding(true)
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null
          setHolding(false)
          reveal()
        }, HOLD_MS)
      }}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
      onPointerCancel={clearTimer}
    >
      {holding && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 m-auto -rotate-90 text-blue-600 dark:text-blue-400"
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={armed ? 0 : RING_CIRCUMFERENCE}
            className={
              holding ? "transition-[stroke-dashoffset] ease-linear" : undefined
            }
            style={{ transitionDuration: `${HOLD_MS}ms` }}
          />
        </svg>
      )}
      {shaded ? <FiEyeOff /> : <FiEye />}
    </Button>
  )
}
