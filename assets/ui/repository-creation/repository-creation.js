// @ts-nocheck

const vscode = acquireVsCodeApi();

async function createNew() {
  const name = $("#new-text").val();
  const private = $("#new-private").is(":checked");
  const url = `https://api.${new URL(github.endpoint).hostname}/repos/${
    github.user
  }/${name}/generate`;
  const res = await fetch({
    body: JSON.stringify({
      owner: github.user,
      name,
      description: `${github.user}'s Syncify Settings Repository`,
      private
    }),
    url,
    method: "POST"
  });
  sendMessage(name);
}

function useExisting() {
  sendMessage($("#existing").val());
}

function sendMessage(name) {
  vscode.postMessage(
    `https://${github.user}:${github.token}@github.com/${github.user}/${name}`
  );
}
