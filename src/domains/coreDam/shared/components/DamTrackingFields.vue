<script lang="ts">
import { createUserAndTimeTrackingFields, useDamCachedUsers } from '@anzusystems/common-admin'

// Created and modified, when and by whom, for every dam detail and form: the library's rows over the dam
// user cache. The link goes to `users`, the route name that stays once `users-new` takes the page over.
export default createUserAndTimeTrackingFields({
  useCachedUsers: useDamCachedUsers,
  userRouteName: '/(coreDam)/users/[id]',
})
</script>
