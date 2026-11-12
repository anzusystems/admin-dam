<script lang="ts">
import { createUserAndTimeTrackingFields, useDamCachedUsers } from '@anzusystems/common-admin'

export default createUserAndTimeTrackingFields({
  useCachedUsers: useDamCachedUsers,
  userRouteName: '/(coreDam)/users/[id]',
})
</script>
