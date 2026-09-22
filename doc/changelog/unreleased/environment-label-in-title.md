planned
===

### Added

- **The environment's label sits in front of the browser title.** A tab on devel reads
  `DEVEL: ADAM`, on stage `STAGE: ADAM`. Production sets no label and the title is exactly what
  it was, so the only tabs that say anything are the ones that are not production.

  The label comes from `APP_LABEL`, which is defined in every environment's variable group --
  including production, where it is deliberately empty. It has to be defined even there: the
  deployment replaces `#{APP_LABEL}#` through `replacetokens`, which leaves an unknown token in
  place rather than blanking it, so a missing variable would print the token itself into the title.

  A config that predates the key is handled as an absent label rather than a crash.
