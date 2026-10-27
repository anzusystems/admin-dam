<script lang="ts">
import { createUserAndTimeTrackingFields, useDamCachedUsers } from '@anzusystems/common-admin'

// The link goes to `users`, the route name that remains once `users-new` replaces the page.
export default createUserAndTimeTrackingFields({
  useCachedUsers: useDamCachedUsers,
  userRouteName: '/(coreDam)/users/[id]',
})
</script>
