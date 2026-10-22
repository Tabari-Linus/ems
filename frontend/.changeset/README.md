# Changesets

Versioning and changelogs for the design-system packages in `projects/` (`@ems/tokens`,
`@ems/icons`, `@ems/ui`). Each package is versioned independently. They are `private` for now,
so `changeset version` bumps versions and writes `CHANGELOG.md` files but nothing is published.

```bash
npm run changeset            # describe a change: pick packages + semver bump, write a summary
npm run changeset:version    # apply pending changesets: bump versions, update changelogs
```

Add a changeset in the same PR as any change to a package that consumers would notice.
See https://github.com/changesets/changesets for details.
