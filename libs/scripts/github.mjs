#!/usr/bin/env node

// import { Octokit } from "@octokit/rest";

// const octokit = new Octokit({
//   auth: "YOUR_ACCESS_KEY",
// });

// console.log(
//   (
//     await octokit.rest.repos.listForUser({
//       username: "therockstorm",
//     })
//   ).data.map((d) => d.name)
// );

// const OWNER = "therockstorm";
// const REPO = "hi";
// const BRANCH = "main";

// // https://octokit.github.io/rest.js/v18#repos-create-for-authenticated-user
// await octokit.repos.createInOrg({
//   allow_auto_merge: true,
//   allow_merge_commit: false,
//   allow_rebase_merge: false,
//   allow_squash_merge: true,
//   delete_branch_on_merge: true,
//   description: undefined,
//   has_downloads: false,
//   has_issues: true,
//   has_projects: false,
//   has_wiki: false,
//   homepage: undefined,
//   is_template: false,
//   name: REPO,
//   org: OWNER,
//   private: true,
//   team_id: undefined,
// });

// await octokit.rest.repos.enableVulnerabilityAlerts({
//   owner: OWNER,
//   repo: REPO,
// });

// await octokit.rest.repos.setAdminBranchProtection({
//   owner: OWNER,
//   repo: REPO,
//   branch: BRANCH,
// });

// await octokit.rest.repos.updateBranchProtection({
//   owner: OWNER,
//   repo: REPO,
//   branch: BRANCH,
//   required_status_checks: { strict: true },
//   enforce_admins: true,
//   required_pull_request_reviews: {
//     dismiss_stale_reviews: true,
//     required_approving_review_count: 1,
//   },
//   required_linear_history: true,
//   allow_force_pushes: false,
//   allow_deletions: false,
// });

// console.log(
//   (
//     await octokit.rest.repos.listForOrg({
//       org: "YOUR_ORG",
//     })
//   ).data.map((d) => d.name)
// );
