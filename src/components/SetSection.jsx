// The building blocks of every Settings section, laid out the way GitHub's
// settings are: a heading with a hairline under it, a short description, then
// one flat bordered box made of rows. `danger` gives the box a red border.
//
//   <SetSection title="School email" sub="...">
//     <SetRow title="Log out" desc="..." action={<button>Log out</button>} />
//     <div className="set-body">...fields...</div>
//     <div className="set-foot"><button>Save</button></div>
//   </SetSection>
//
// Pass `as="form"` (with onSubmit etc.) when the whole section is one form.

export function SetSection({ title, sub, actions, danger = false, as = 'section', children, ...rest }) {
  const Tag = as
  return (
    <Tag className={`set-sec${danger ? ' is-danger' : ''}`} {...rest}>
      <div className="set-sec-head">
        <h2 className="set-sec-title">{title}</h2>
        {actions}
      </div>
      {sub && <p className="set-sec-sub">{sub}</p>}
      <div className="set-box">{children}</div>
    </Tag>
  )
}

// One row: what it is on the left (title + a muted line), its control on the right.
export function SetRow({ title, desc, action, children }) {
  return (
    <div className="set-row">
      <div className="set-row-text">
        {title && <p className="set-row-title">{title}</p>}
        {desc && <p className="set-row-desc">{desc}</p>}
        {children}
      </div>
      {action && <div className="set-row-action">{action}</div>}
    </div>
  )
}
