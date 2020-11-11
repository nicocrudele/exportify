import $ from "jquery" // TODO: Remove jQuery dependency
import Bottleneck from "bottleneck"

export function authorize() {
  var client_id = getQueryParam('app_client_id');

  // Use Exportify application client_id if none given
  if (client_id === '') {
    client_id = "9950ac751e34487dbbe027c4fd7f8e99"
  }

  window.location.href = "https://accounts.spotify.com/authorize" +
    "?client_id=" + client_id +
    "&redirect_uri=" + encodeURIComponent([window.location.protocol, '//', window.location.host, window.location.pathname].join('')) +
    "&scope=playlist-read-private%20playlist-read-collaborative%20user-library-read" +
    "&response_type=token";
}

// http://stackoverflow.com/a/901144/4167042
export function getQueryParam(name) {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(window.location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 0
})

// Listen to the "failed" event
limiter.on("failed", async (error, jobInfo) => {
  const id = jobInfo.options.id
  console.warn(`Job ${id} failed with status: ${error.status}`)

  if (error.status === 401) {
    // Return to home page after auth token expiry
    window.location.href = window.location.href.split('#')[0]
  } else if (error.status === 429 && jobInfo.retryCount === 0) {
    // Retry according to the indication from the server with a small buffer
    let delay = (error.getResponseHeader("Retry-After") * 1000) + 1000 // TODO: Implement fallback

    // TODO: Implement UI update

    return delay;
  } else {
    // TODO: Improve
    alert(error.responseText)
  }
})

// Listen to the "retry" event
limiter.on("retry", (error, jobInfo) => {
  // TODO: Implement UI update
})

export const apiCall = limiter.wrap(function(url, accessToken) {
  return $.ajax({
    url: url,
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
})
