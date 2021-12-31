#!/usr/bin/env node
// #!/usr/bin/env zx
// import "zx/globals";

// await $`cat package.json | grep name`;

// await Promise.all([$`sleep 1; echo 1`, $`sleep 2; echo 2`, $`sleep 3; echo 3`]);

// let dir = "fooBar";
// await $`mkdir /tmp/${dir}`;

import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: "YOUR_PERSONAL_ACCESS_TOKEN",
});

// console.log(
//   (
//     await octokit.rest.repos.listForUser({
//       username: "therockstorm",
//     })
//   ).data.map((d) => d.name)
// );

const OWNER = "therockstorm";
const REPO = "testing-api";
const BRANCH = "main";

// https://octokit.github.io/rest.js/v18#repos-create-for-authenticated-user
await octokit.repos.createForAuthenticatedUser({
  name: REPO,
  private: true,
  has_issues: true,
  has_projects: false,
  has_wiki: false,
  allow_squash_merge: true,
  allow_merge_commit: false,
  allow_rebase_merge: false,
  allow_auto_merge: true,
  delete_branch_on_merge: true,
  has_downloads: false,
  is_template: false,
});

await octokit.rest.repos.enableVulnerabilityAlerts({
  owner: OWNER,
  repo: REPO,
});

await octokit.rest.repos.setAdminBranchProtection({
  owner: OWNER,
  repo: REPO,
  branch: BRANCH,
});

await octokit.rest.repos.updateBranchProtection({
  owner: OWNER,
  repo: REPO,
  branch: BRANCH,
  required_status_checks: { strict: true },
  enforce_admins: true,
  required_pull_request_reviews: {
    dismiss_stale_reviews: true,
    required_approving_review_count: 1,
  },
  required_linear_history: true,
  allow_force_pushes: false,
  allow_deletions: false,
});
