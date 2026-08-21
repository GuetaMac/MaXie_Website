/**
 * A consistent header used at the top of every section page.
 * Props:
 *  - icon: emoji string
 *  - title: page title
 *  - description: short description text
 */
function PageHeader({ icon, title, description }) {
  return (
    <div className="mb-8 text-center sm:text-left">
      <span className="text-4xl">{icon}</span>
      <h1 className="text-3xl mt-2 mb-1">{title}</h1>
      <p className="text-plum-400 max-w-xl mx-auto sm:mx-0">{description}</p>
    </div>
  )
}

export default PageHeader
