// Helper functions for GitHub Actions workflows

/**
 * Create a comment on an issue and immediately unsubscribe from notifications
 * @param {Object} github - The github object from actions/github-script
 * @param {Object} context - The context object from actions/github-script
 * @param {number} issueNumber - The issue number to comment on
 * @param {string} commentBody - The comment text to post
 * @returns {Object} The created comment object
 */
async function createComment(github, context, issueNumber, commentBody) {
  // Create the comment
  const comment = await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    body: commentBody
  });
  
  // Get the issue details for thread_id
  const issue = await github.rest.issues.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber
  });
  
  // Unsubscribe immediately after commenting
  try {
    await github.rest.activity.deleteThreadSubscription({
      thread_id: issue.data.id
    });
    console.log(`Comment posted and unsubscribed from issue #${issueNumber}`);
  } catch (error) {
    if (error.status === 304) {
      console.log(`Comment posted, already unsubscribed from issue #${issueNumber}`);
    } else {
      console.log(`Comment posted but could not unsubscribe: ${error.message}`);
    }
  }
  
  return comment;
}

/**
 * Create an issue and immediately unsubscribe from notifications
 * @param {Object} github - The github object from actions/github-script
 * @param {Object} context - The context object from actions/github-script
 * @param {string} title - Issue title
 * @param {string} body - Issue body
 * @param {Array} labels - Optional array of labels
 * @returns {Object} The created issue object
 */
async function createIssue(github, context, title, body, labels = []) {
  // Create the issue
  const issue = await github.rest.issues.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title: title,
    body: body,
    labels: labels
  });
  
  // Unsubscribe immediately after creation
  try {
    await github.rest.activity.deleteThreadSubscription({
      thread_id: issue.data.id
    });
    console.log(`Issue #${issue.data.number} created and unsubscribed`);
  } catch (error) {
    if (error.status !== 304) {
      console.log(`Issue created but could not unsubscribe: ${error.message}`);
    }
  }
  
  return issue;
}

// Export functions for use in workflows
// When using eval(), we'll capture these directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createComment,
    createIssue
  };
}

// For eval() usage, make functions available globally
const githubHelpers = {
  createComment,
  createIssue
};