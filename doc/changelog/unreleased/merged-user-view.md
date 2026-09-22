planned
===

### Added

- **One page for the whole account, at `/users-new`.** Until now the same person was edited in two
  places: `/users` for licences, licence groups, ext systems and distribution services, and
  `/anzu-users` for roles, permission groups and grants. They are one row in one table, and
  `PUT /adm/users/{id}` takes all of it, so the new page saves both halves in a single call. It sits
  beside both originals -- in the menu only with debug features switched on -- until its parity is
  confirmed, and then takes `/users` over.

- **Permission groups from the shared components, at `/permission-groups-new`**, on the same terms.

### Changed

- **Creating an account now asks for the same fields as editing one.** It used to need only an id
  and an e-mail; the name, the full name and the avatar were required on the edit form alone. How
  strict the form is, is a property of the system now, and it applies the same way to both.

- **The avatar colour is validated by its shape rather than its length.** `#GGGGGG` is seven
  characters and used to pass the form and fail on the server.

### Removed

- **The "Nové heslo" field is gone.** Nothing ever read it: `plainPassword` appears in no PHP in
  `core-dam` or `core-dam-bundle`, and the endpoint drops keys it does not know, so whatever was
  typed there was discarded on arrival. It was only ever visible with `userAuthType` set to
  `JsonCredentials`. Setting a password from the admin would be a new backend feature, not a repair
  of this one.
