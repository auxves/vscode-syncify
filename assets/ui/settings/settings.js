// @ts-nocheck

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

const vscode = acquireVsCodeApi();

const textInputTemplate = `<div class="form-group mb-4">
            <label for="setting:@correspondingSetting"
              >@name</label
            >
            <input
              type="text"
              class="form-control text"
              id="setting:@correspondingSetting"
              placeholder="@placeholder"
              setting="@correspondingSetting"
            />
          </div>`;

const textInputGroupTemplate = `<div class="mb-4">
          <label for="setting:@correspondingSetting"
            >@name</label
          >
          <div class="input-group">
            <input
              type="text"
              class="form-control text"
              id="setting:@correspondingSetting"
              placeholder="@placeholder"
              setting="@correspondingSetting"
            />
            <div class="input-group-append">
              <button class="btn btn-primary" @disabled onclick="@action" type="button" id="button-addon2">View</button>
            </div>
          </div>
        </div>`;

const numberInputTemplate = `<div class="form-group mb-4">
            <label for="setting:@correspondingSetting"
              >@name</label
            >
            <input
              type="number"
              class="form-control number"
              id="setting:@correspondingSetting"
              placeholder="@placeholder"
              setting="@correspondingSetting"
            />
          </div>`;

const checkboxTemplate = `<div class="custom-control custom-checkbox my-1 mr-sm-2 mb-4">
            <input
              class="custom-control-input checkbox"
              type="checkbox"
              id="setting:@correspondingSetting"
              setting="@correspondingSetting"
            />
            <label
              for="setting:@correspondingSetting"
              class="custom-control-label"
            >@name</label>
          </div>`;

const textareaTemplate = `<div class="form-group mb-3">
            <label
              for="setting:@correspondingSetting"
             
              >@name</label>
            <textarea
              class="form-control textarea"
              id="setting:@correspondingSetting"
              data-min-rows="1"
              placeholder="@placeholder"
              setting="@correspondingSetting"
            ></textarea>
          </div>`;

const selectTemplate = `
<div class="form-group mb-3">
  <label for="setting:@correspondingSetting">@name</label>
  <select
    class="form-control select"
    id="setting:@correspondingSetting"
    setting="@correspondingSetting"
  >
    @options
  </select>
</div>`;

const sectionTemplate = `<div><h3 class="mx-auto mt-2 text-left">
@NAME
</h3><div>`;

const parent = document.querySelector("#settings");
const saveStatus = document.querySelector("#saveStatus");

map.forEach(section => {
  const sectionParent = appendHTML(
    parent,
    sectionTemplate.replace(new RegExp("@NAME", "g"), section.name)
  )[0];
  section.settings.forEach(settingMap => {
    let template;
    switch (settingMap.type) {
      case "textinput":
        template = textInputTemplate;
        break;
      case "numberinput":
        template = numberInputTemplate;
        break;
      case "checkbox":
        template = checkboxTemplate;
        break;
      case "textarea":
        template = textareaTemplate;
        break;
      case "select":
        template = selectTemplate;
        break;
    }
    const html = template
      .replace(new RegExp("@name", "g"), settingMap.name)
      .replace(new RegExp("@placeholder", "g"), settingMap.placeholder)
      .replace(
        new RegExp("@correspondingSetting", "g"),
        settingMap.correspondingSetting
      )
      .replace(
        new RegExp("@options"),
        settingMap.options
          ? settingMap.options.map(
              option =>
                `<option value="${option.value}">${option.name}</option>`
            )
          : ""
      );
    appendHTML(sectionParent, html);
  });
});

$(document).ready(function() {
  $(".text")
    .each((i, el) => {
      $(el).val(_.get(data, $(el).attr("setting")));
    })
    .change(function() {
      save();
      let val = $(this).val();
      vscode.postMessage({
        command: $(this).attr("setting"),
        text: val
      });
    });
  $(".number")
    .each((i, el) => {
      $(el).val(_.get(data, $(el).attr("setting")));
    })
    .change(function() {
      save();
      let val = Number($(this).val());
      vscode.postMessage({
        command: $(this).attr("setting"),
        text: val
      });
    });
  $(".checkbox")
    .each((i, el) => {
      $(el).prop("checked", _.get(data, $(el).attr("setting")));
    })
    .change(function() {
      save();
      let val = $(this).is(":checked");
      vscode.postMessage({
        command: $(this).attr("setting"),
        text: val
      });
    });
  $(".textarea")
    .each((i, el) => {
      let str = "";
      const items = _.get(data, $(el).attr("setting"));
      items.forEach(item => (str += item + "\n"));
      $(el).val(str.slice(0, -1));
      $(el).prop("rows", items.length);
    })
    .change(function() {
      save();
      let val = [];
      $(this)
        .val()
        .split("\n")
        .forEach(item => {
          if (item !== "") {
            val.push(item);
          }
        });
      vscode.postMessage({
        command: $(this).attr("setting"),
        text: val
      });
    });
  $(".select")
    .each((i, el) => {
      const setting = _.get(data, $(el).attr("setting"));
      $(el).val(setting);
    })
    .change(function() {
      save();
      let val = $(this).val();
      vscode.postMessage({
        command: $(this).attr("setting"),
        text: val
      });
    });
});

function save() {
  saveStatus.innerHTML = `<i class="spinner-border docked"></i>`;
  setTimeout(() => (saveStatus.innerHTML = ``), 1000);
}
