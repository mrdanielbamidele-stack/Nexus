import { useEffect, useId, useRef, useState } from 'react'
import UiIcon from '../../components/UiIcon'

// A dropdown that matches the owner area (the browser's own list can't be
// styled). Click or press Enter / Space / arrow keys to open; arrows move,
// Enter picks, Escape or a click elsewhere closes.
export default function DeleSelect({ value, options, onChange, label }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef(null)
  const listId = useId()

  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    const onPointer = e => { if (!root.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  function show() {
    setActive(selectedIndex)
    setOpen(true)
  }

  function pick(index) {
    setOpen(false)
    if (options[index].value !== value) onChange(options[index].value)
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return show()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive(i => (i + step + options.length) % options.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open) pick(active)
      else show()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className="dl-select" ref={root}>
      <button
        type="button"
        className={`dl-select-button${open ? ' open' : ''}`}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
      >
        <span>{selected.label}</span>
        <UiIcon name="chevron" size={16} />
      </button>

      {open && (
        <ul
          id={listId}
          className="dl-select-list"
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${listId}-${active}`}
        >
          {options.map((option, i) => (
            <li
              key={option.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={option.value === value}
              className={`${i === active ? 'active' : ''}${option.value === value ? ' chosen' : ''}`.trim()}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(i)}
            >
              <span>{option.label}</span>
              {option.value === value && <UiIcon name="check" size={15} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
