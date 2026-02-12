export type StatusGroupType = {
  name: string
  alias?: string
  list: StatusItemType[]
}

export type StatusItemType = {
  name: string
  alias?: string
  status: string
}

export type Pages = {
  id: number
  name: string
  slug: string
  report: string
  api: string
}
