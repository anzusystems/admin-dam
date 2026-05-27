import type { VideoShow } from '@/types/coreDam/VideoShow'

const { required, maxLength, minLength } = useValidate()

export function useVideoShowValidation(videoShow: Ref<VideoShow>) {
  const rules = computed(() => ({
    videoShow: {
      texts: {
        title: {
          required,
          minLength: minLength(1),
          maxLength: maxLength(100),
        },
      },
    },
  }))
  const v$ = useVuelidate(rules, { videoShow })

  return {
    v$,
  }
}
