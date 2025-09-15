// Helper functions for GitHub Actions workflows

/**
 * Drop-in replacement for github.rest.issues.createComment that automatically unsubscribes
 * @param {Object} params - Same parameters as github.rest.issues.createComment
 * @returns {Object} The created comment object
 */
async function createComment(params) {
  // Create the comment using the standard API
  const comment = await github.rest.issues.createComment(params);
  
  // Get the issue node ID and unsubscribe using GraphQL
  try {
    const issueQuery = `
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $number) {
            id
          }
        }
      }
    `;
    
    const issueResult = await github.graphql(issueQuery, {
      owner: params.owner,
      repo: params.repo,
      number: params.issue_number
    });
    
    const issueNodeId = issueResult.repository.issue.id;
    
    // Unsubscribe using GraphQL
    const mutation = `
      mutation($subscribableId: ID!, $state: SubscriptionState!) {
        updateSubscription(input: {
          subscribableId: $subscribableId,
          state: $state
        }) {
          subscribable {
            viewerSubscription
          }
        }
      }
    `;
    
    const result = await github.graphql(mutation, {
      subscribableId: issueNodeId,
      state: 'UNSUBSCRIBED'
    });
    
    console.log(`Comment posted and unsubscribed from issue #${params.issue_number}`);
  } catch (error) {
    console.log(`Comment posted but could not unsubscribe: ${error.message}`);
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
  
  // Unsubscribe using GraphQL (we already have node_id from creation)
  try {
    const issueNodeId = issue.data.node_id;
    console.log(`Created issue #${issue.data.number} with node ID: ${issueNodeId}`);
    
    // First check the subscription status
    const checkQuery = `
      query($id: ID!) {
        node(id: $id) {
          ... on Issue {
            viewerSubscription
          }
        }
      }
    `;
    
    const checkResult = await github.graphql(checkQuery, {
      id: issueNodeId
    });
    
    console.log(`Current subscription state: ${checkResult.node.viewerSubscription}`);
    
    if (checkResult.node.viewerSubscription === 'SUBSCRIBED') {
      const mutation = `
        mutation($subscribableId: ID!, $state: SubscriptionState!) {
          updateSubscription(input: {
            subscribableId: $subscribableId,
            state: $state
          }) {
            subscribable {
              viewerSubscription
            }
          }
        }
      `;
      
      const result = await github.graphql(mutation, {
        subscribableId: issueNodeId,
        state: 'UNSUBSCRIBED'
      });
      
      console.log(`Issue #${issue.data.number} created and unsubscribed, new state: ${result.updateSubscription.subscribable.viewerSubscription}`);
    } else {
      console.log(`Issue #${issue.data.number} created, already ${checkResult.node.viewerSubscription}`);
    }
  } catch (error) {
    console.log(`Issue created but could not unsubscribe: ${error.message}`);
    if (error.errors) {
      console.log(`GraphQL errors:`, JSON.stringify(error.errors, null, 2));
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