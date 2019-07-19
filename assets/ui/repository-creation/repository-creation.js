// @ts-nocheck

const vscode = acquireVsCodeApi();

function appendHTML(parent, html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  const children = [...div.children];
  while (div.children.length > 0) {
    parent.appendChild(div.children[0]);
  }
  div.remove();
  return children;
}

function modal(title, message, options) {
  const modalTemplate = `<div
      class="modal fade"
      id="${options.id}"
      tabindex="-1"
      role="dialog"
      aria-labelledby="exampleModalCenterTitle"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content ${
          document.body.className.includes("dark") ? "bg-dark" : "bg-light"
        }">
          <div class="modal-header">
            <h5 class="modal-title text-left" id="exampleModalCenterTitle">
              ${title}
            </h5>
          </div>
          <div class="modal-body text-left">
            ${message}
          </div>
          <div class="modal-footer">
          ${
            options.back
              ? `<button
          type="button"
          class="btn btn-secondary"
          data-dismiss="modal"
          onclick="setTimeout(() => $('#${options.id}').remove(), 500);"
        >
          Back
        </button>`
              : ""
          }
           ${
             options.close
               ? `<button
           type="button"
           class="btn btn-primary"
           onclick="vscode.postMessage({close: true});setTimeout(() => $('#${
             options.id
           }').remove(), 500);"
         >
           Close Tab
         </button>`
               : ""
           } 
          </div>
        </div>
      </div>
    </div>`;
  const modal = appendHTML(document.querySelector("body"), modalTemplate)[0];
  $(modal).modal();
}

async function createNew() {
  const name = $("#new-text").val();
  if (!name) {
    return modal(
      "Invalid Repository Name!",
      `The name of the repository must not be empty.`,
      { back: true }
    );
  }
  const private = $("#new-private").is(":checked");
  const host = new URL(github.host).hostname;
  const res = await fetch(`https://api.${host}/user/repos`, {
    body: JSON.stringify({
      owner: github.user,
      name,
      description: `${github.user}'s Syncify Settings Repository`,
      private
    }),
    method: "POST",
    headers: {
      Authorization: `token ${github.token}`
    }
  });
  const repo = await res.json();
  if (repo.name) {
    modal(
      "Repository Created!",
      `The repository has been created and registered with Syncify! You may now lose
    this tab.`,
      { close: true }
    );
    sendMessage(name);
  } else {
    modal("Error Creating Repository!", repo.message, { back: true });
  }
}

async function useExisting() {
  const name = $("#existing").val();
  if (!name) {
    return modal(
      "Invalid Repository Name!",
      `The name of the repository must not be empty.`,
      { back: true }
    );
  }
  const host = new URL(github.host).hostname;
  const res = await fetch(`https://api.${host}/repos/${github.user}/${name}`, {
    headers: {
      Authorization: `token ${github.token}`
    }
  });
  const repo = await res.json();
  if (repo.message !== "Not Found") {
    modal(
      "Repository Registered!",
      `The repository has been registered with Syncify! You may now lose
    this tab.`,
      { close: true }
    );
    sendMessage(name);
  } else {
    modal(
      "Error Registering Repository!",
      `The repository you requested was not found.`,
      { back: true }
    );
  }
}

function sendMessage(name) {
  const host = new URL(github.host).hostname;
  vscode.postMessage(
    `https://${github.user}:${github.token}@${host}/${github.user}/${name}`
  );
}
