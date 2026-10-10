import { useEffect, useId, useMemo, useRef, useState } from 'react'
import UiIcon from './UiIcon'

// "cos101", "COS 101" and "tum-ges 101" should all find the same course.
const squash = text => text.toLowerCase().replace(/[\s-]+/g, '')

const labelOf = course => `${course.code} · ${course.title}`

// Wrap the part of `text` that matches `query` in <mark>.
function highlight(text, query) {
  const q = query.trim().toLowerCase()
  const at = q ? text.toLowerCase().indexOf(q) : -1
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  )
}

// A search-as-you-type course picker. With nothing typed it lists every course
// in the order given (callers pass them A to Z); typing narrows the list, best
// matches first. Keyboard friendly: arrows, Enter, Esc.
export default function CourseCombobox({ courses, value, onChange, invalid = false, disabled = false, inputRef }) {
  const listId = useId()
  const wrapRef = useRef(null)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const selected = courses.find(c => c.code === value)
  const typing = !selected || text !== labelOf(selected)

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase()
    const key = squash(text)
    if (!typing || !key) return courses
    return courses
      .filter(c => squash(c.code).includes(key) || c.title.toLowerCase().includes(q))
      .sort((a, b) => Number(squash(b.code).startsWith(key)) - Number(squash(a.code).startsWith(key)))
      .slice(0, 30)
  }, [courses, text, typing])

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return
    wrapRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function choose(course) {
    onChange(course.code)
    setText(labelOf(course))
    setOpen(false)
  }

  function clear() {
    onChange('')
    setText('')
    setActive(0)
    setOpen(true)
    inputRef?.current?.focus()
  }

  function onInput(e) {
    setText(e.target.value)
    if (value) onChange('') // typing again un-picks the course
    setActive(0)
    setOpen(true)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive(i => Math.min(i + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && matches[active]) {
      e.preventDefault()
      choose(matches[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Leaving the field: if what they typed narrows to exactly one course, take it.
  function onBlur(e) {
    if (wrapRef.current?.contains(e.relatedTarget)) return
    setOpen(false)
    if (!value && text.trim() && matches.length === 1) choose(matches[0])
  }

  return (
    <div className={`up-combo${invalid ? ' invalid' : ''}${value ? ' picked' : ''}`} ref={wrapRef} onBlur={onBlur}>
      <div className="up-combo-field">
        <UiIcon name="search" size={18} className="up-combo-icon" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          aria-label="Course"
          placeholder="Search by code or title - e.g. COS 101"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={text}
          onChange={onInput}
          onFocus={e => { setOpen(true); if (!typing) e.target.select() }}
          onKeyDown={onKeyDown}
        />
        {value && <UiIcon name="check" size={18} className="up-combo-ok" />}
        {text && !disabled && (
          <button type="button" className="up-combo-clear" onClick={clear} aria-label="Clear course">
            <UiIcon name="x" size={15} />
          </button>
        )}
      </div>

      {open && (
        <ul className="up-combo-list" id={listId} role="listbox">
          {matches.length ? matches.map((course, i) => (
            <li
              key={course.code}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={course.code === value ? 'chosen' : ''}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(course)}
            >
              <span className="up-combo-code">{typing ? highlight(course.code, text) : course.code}</span>
              <span className="up-combo-title">{typing ? highlight(course.title, text) : course.title}</span>
              {course.code === value && <UiIcon name="check" size={16} />}
            </li>
          )) : (
            <li className="up-combo-empty" role="option" aria-selected="false">
              No course matches &ldquo;{text.trim()}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
