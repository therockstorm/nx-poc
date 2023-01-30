#!/usr/bin/env node

import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: "",
});

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

const data = await getPaginatedData("/repos/mprimi/portable-secret/stargazers");
console.log(data[0], data.length);

// https://octokit.github.io/rest.js/v18#repos-create-for-authenticated-user
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

async function getPaginatedData(url) {
  const nextPattern = /(?<=<)([\S]*)(?=>; rel="Next")/i;
  let pagesRemaining = true;
  let data = [];

  while (pagesRemaining) {
    const response = await octokit.request(`GET ${url}`, {
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    const parsedData = parseData(response.data);
    data = [...data, ...parsedData];

    const linkHeader = response.headers.link;

    pagesRemaining = linkHeader && linkHeader.includes(`rel=\"next\"`);

    if (pagesRemaining) {
      url = linkHeader.match(nextPattern)[0];
    }
  }

  return data;
}

function parseData(data) {
  // If the data is an array, return that
  if (Array.isArray(data)) {
    return data;
  }

  // Some endpoints respond with 204 No Content instead of empty array
  //   when there is no data. In that case, return an empty array.
  if (!data) {
    return [];
  }

  // Otherwise, the array of items that we want is in an object
  // Delete keys that don't include the array of items
  delete data.incomplete_results;
  delete data.repository_selection;
  delete data.total_count;
  // Pull out the array of items
  const namespaceKey = Object.keys(data)[0];
  data = data[namespaceKey];

  return data;
}
