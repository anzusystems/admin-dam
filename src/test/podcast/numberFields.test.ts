import type { Validation } from '@vuelidate/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import type { Ref } from 'vue'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * A number field bound without `.number` sent its text: an emptied field went as "", which the server stores as 0,
 * and a negative order failed with a server error, as the server keeps orders and durations unsigned.
 * With `.number` an emptied field sends null. A field the server takes only as a number is required,
 * an order or a duration is at least 0, and an optional season or episode number stays empty.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

const sources = import.meta.glob<string>('/src/**/*.vue', { query: '?raw', import: 'default', eager: true })

describe('the number fields of admin-dam', () => {
  it('are all bound as numbers, so an emptied one sends null and not ""', () => {
    const asText: string[] = []
    let found = 0
    for (const [file, source] of Object.entries(sources)) {
      for (const [, attributes] of source.matchAll(/<AFormTextField\b([\s\S]*?)\/>/g)) {
        if (!/\btype="number"/.test(attributes)) continue
        found++
        const model = attributes.match(/\bv-model(\.\w+)*="([^"]+)"/)
        if (!model?.[0].startsWith('v-model.number=')) asText.push(file + ': ' + (model?.[2] ?? 'no v-model'))
      }
    }

    // The 19 fields of the report and those that were already right.
    expect(found).toBeGreaterThan(19)
    expect(asText).toEqual([])
  })
})

type Form = Ref<Record<string, unknown>>

const VALUES = [null, -1, 0, 1] as const

describe('the rules of the number fields', () => {
  it('require the numbers the server takes only as numbers, keep orders and durations at 0 or more, and leave the season and episode empty', async () => {
    const ui = await startUploadUi({ server })
    const { usePodcastFactory } = await import('@/domains/coreDam/podcast/factory/PodcastFactory')
    const { usePodcastValidation } = await import('@/domains/coreDam/podcast/composables/podcastValidation')
    const { usePodcastEpisodeFactory } = await import('@/domains/coreDam/podcastEpisode/factory/PodcastEpisodeFactory')
    const { usePodcastEpisodeValidation } =
      await import('@/domains/coreDam/podcastEpisode/composables/podcastEpisodeValidation')
    const { useVideoShowFactory } = await import('@/domains/coreDam/videoShow/factory/VideoShowFactory')
    const { useVideoShowValidation } = await import('@/domains/coreDam/videoShow/composables/videoShowValidation')
    const { useVideoShowEpisodeFactory } =
      await import('@/domains/coreDam/videoShowEpisode/factory/VideoShowEpisodeFactory')
    const { useVideoShowEpisodeValidation } =
      await import('@/domains/coreDam/videoShowEpisode/composables/videoShowEpisodeValidation')
    const { useAssetListViewFactory } = await import('@/domains/coreDam/assetListView/factory/AssetListViewFactory')
    const { useAssetListViewValidation } =
      await import('@/domains/coreDam/assetListView/composables/assetListViewValidation')
    const { useAuthorCleanPhraseFactory } =
      await import('@/domains/coreDam/authorCleanPhrase/factory/AuthorCleanPhraseFactory')
    const { useAuthorCleanPhraseValidation } =
      await import('@/domains/coreDam/authorCleanPhrase/composables/authorCleanPhraseValidation')

    const forms: Record<string, { form: Form; v$: Ref<Validation> }> = {}
    await ui.mount(async () => ({
      default: defineComponent({
        setup() {
          const podcast = ref(usePodcastFactory().createDefault(1))
          forms.podcast = { form: podcast as never, v$: usePodcastValidation(podcast).v$ as never }
          const podcastEpisode = ref(usePodcastEpisodeFactory().createDefault(1, 'podcast-1'))
          forms.podcastEpisode = {
            form: podcastEpisode as never,
            v$: usePodcastEpisodeValidation(podcastEpisode).v$ as never,
          }
          const videoShow = ref(useVideoShowFactory().createDefault(1))
          forms.videoShow = { form: videoShow as never, v$: useVideoShowValidation(videoShow).v$ as never }
          const videoShowEpisode = ref(useVideoShowEpisodeFactory().createDefault(1, 'show-1'))
          forms.videoShowEpisode = {
            form: videoShowEpisode as never,
            v$: useVideoShowEpisodeValidation(videoShowEpisode).v$ as never,
          }
          const assetListView = ref(useAssetListViewFactory().createDefault())
          forms.assetListView = {
            form: assetListView as never,
            v$: useAssetListViewValidation(assetListView).v$ as never,
          }
          const authorCleanPhrase = ref(useAuthorCleanPhraseFactory().createDefault(1))
          forms.authorCleanPhrase = {
            form: authorCleanPhrase as never,
            v$: useAuthorCleanPhraseValidation(authorCleanPhrase).v$ as never,
          }

          return () => null
        },
      }),
    }))

    // Whether each value of VALUES is refused, or "no rule" when the field has none.
    const refused = (name: string, path: string[]) => {
      const { form, v$ } = forms[name]
      const holder = path.slice(0, -1).reduce((object, key) => object[key] as Record<string, unknown>, form.value)
      const field = path.at(-1)!
      const before = holder[field]
      const results = VALUES.map((value) => {
        holder[field] = value
        const rule = [name, ...path].reduce<Record<string, unknown> | undefined>(
          (object, key) => object?.[key] as Record<string, unknown> | undefined,
          v$.value as never
        )

        return rule ? rule.$invalid : 'no rule'
      })
      holder[field] = before

      return results
    }

    const ORDER = [true, true, false, false]
    const OPTIONAL_FROM_ONE = [false, true, true, false]
    const REQUIRED = [true, false, false, false]

    expect({
      'podcast web order': refused('podcast', ['attributes', 'webOrderPosition']),
      'podcast mobile order': refused('podcast', ['attributes', 'mobileOrderPosition']),
      'episode web order': refused('podcastEpisode', ['attributes', 'webOrderPosition']),
      'episode mobile order': refused('podcastEpisode', ['attributes', 'mobileOrderPosition']),
      'episode duration': refused('podcastEpisode', ['attributes', 'duration']),
      'episode season': refused('podcastEpisode', ['attributes', 'seasonNumber']),
      'episode number': refused('podcastEpisode', ['attributes', 'episodeNumber']),
      'video show web order': refused('videoShow', ['attributes', 'webOrderPosition']),
      'video show mobile order': refused('videoShow', ['attributes', 'mobileOrderPosition']),
      'video episode web order': refused('videoShowEpisode', ['attributes', 'webOrderPosition']),
      'video episode mobile order': refused('videoShowEpisode', ['attributes', 'mobileOrderPosition']),
      'list view position': refused('assetListView', ['position']),
      'clean phrase position': refused('authorCleanPhrase', ['position']),
    }).toEqual({
      'podcast web order': ORDER,
      'podcast mobile order': ORDER,
      'episode web order': ORDER,
      'episode mobile order': ORDER,
      'episode duration': ORDER,
      'episode season': OPTIONAL_FROM_ONE,
      'episode number': OPTIONAL_FROM_ONE,
      'video show web order': ORDER,
      'video show mobile order': ORDER,
      'video episode web order': ORDER,
      'video episode mobile order': ORDER,
      'list view position': REQUIRED,
      'clean phrase position': REQUIRED,
    })
  })
})
