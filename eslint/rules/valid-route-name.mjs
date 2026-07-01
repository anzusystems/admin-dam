import fs from 'node:fs'
import path from 'node:path'

const TYPED_ROUTER_PATH = path.resolve(process.cwd(), 'src/typed-router.d.ts')

let cachedRoutes = null
let cachedMtimeMs = 0

function loadRoutes() {
  let stat
  try {
    stat = fs.statSync(TYPED_ROUTER_PATH)
  } catch {
    return cachedRoutes ?? new Set()
  }
  if (cachedRoutes && stat.mtimeMs === cachedMtimeMs) return cachedRoutes

  const content = fs.readFileSync(TYPED_ROUTER_PATH, 'utf8')
  const routes = new Set()
  const re = /'([^']+)':\s*RouteRecordInfo/g
  let m
  while ((m = re.exec(content)) !== null) {
    routes.add(m[1])
  }
  cachedRoutes = routes
  cachedMtimeMs = stat.mtimeMs
  return routes
}

function isRouteKey(key) {
  if (!key) return false
  const normalized = String(key).replace(/-/g, '').toLowerCase()
  return normalized === 'name' || normalized === 'route' || normalized.endsWith('routename')
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Validate route names against generated src/typed-router.d.ts',
    },
    schema: [],
    messages: {
      unknown:
        "Unknown route name '{{name}}'. Not found in src/typed-router.d.ts. " +
        'Run `yarn generate:dts` if routes were just added.',
    },
  },
  create(context) {
    const routes = loadRoutes()
    if (routes.size === 0) return {}

    function checkLiteral(node, value) {
      if (typeof value !== 'string') return
      if (!value.startsWith('/')) return
      if (routes.has(value)) return
      context.report({ node, messageId: 'unknown', data: { name: value } })
    }

    function checkProperty(prop) {
      if (!prop || prop.type !== 'Property') return
      const key = prop.key
      const keyName =
        key.type === 'Identifier' ? key.name : key.type === 'Literal' ? String(key.value) : null
      if (!isRouteKey(keyName)) return
      const val = prop.value
      if (val && val.type === 'Literal') {
        checkLiteral(val, val.value)
      }
    }

    function checkAttributeLiteral(node) {
      const key = node.key
      if (!key) return
      let name
      if (key.type === 'VIdentifier') {
        name = key.name
      } else if (key.type === 'VDirectiveKey') {
        if (key.name?.name !== 'bind') return
        const arg = key.argument
        if (!arg || arg.type !== 'VIdentifier') return
        name = arg.name
      }
      if (!isRouteKey(name)) return
      const val = node.value
      if (!val) return
      if (val.type === 'VLiteral') {
        checkLiteral(val, val.value)
        return
      }
      if (val.type === 'VExpressionContainer' && val.expression?.type === 'Literal') {
        checkLiteral(val.expression, val.expression.value)
      }
    }

    const scriptVisitor = {
      Property: checkProperty,
    }

    const templateVisitor = {
      VAttribute: checkAttributeLiteral,
      'VElement > VStartTag > VAttribute > VExpressionContainer Property': checkProperty,
    }

    const parserServices = context.sourceCode?.parserServices ?? context.parserServices
    if (parserServices?.defineTemplateBodyVisitor) {
      return parserServices.defineTemplateBodyVisitor(templateVisitor, scriptVisitor)
    }
    return scriptVisitor
  },
}
