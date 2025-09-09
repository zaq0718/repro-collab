// Helper functions for GitHub Actions workflows

/**
 * Drop-in replacement for github.rest.issues.createComment that automatically unsubscribes
 * @param {Object} params - Same parameters as github.rest.issues.createComment
 * @returns {Object} The created comment object
 */
async function createComment(params) {
  // Create the comment using the standard API
  const comment = await github.rest.issues.createComment(params);
  
  // Get the issue details for thread_id
  const issue = await github.rest.issues.get({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.issue_number
  });
  
  // Unsubscribe immediately after commenting
  try {
    await github.rest.activity.deleteThreadSubscription({
      thread_id: issue.data.id
    });
    console.log(`Comment posted and unsubscribed from issue #${params.issue_number}`);
  } catch (error) {
    if (error.status === 304) {
      console.log(`Comment posted, already unsubscribed from issue #${params.issue_number}`);
    } else {
      console.log(`Comment posted but could not unsubscribe: ${error.message}`);
    }
  }
  
  return comment;
}

/**
 * Drop-in replacement for github.rest.issues.create that automatically unsubscribes
 * @param {Object} params - Same parameters as github.rest.issues.create
 * @returns {Object} The created issue object
 */
async function createIssue(params) {
  // Create the issue using the standard API
  const issue = await github.rest.issues.create(params);
  
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
} else {
  // For eval() usage - assign to pre-declared variable
  githubHelpers = {
    createComment,
    createIssue
  };
}