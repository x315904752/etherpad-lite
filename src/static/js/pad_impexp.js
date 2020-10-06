/**
 * This code is mostly from the old Etherpad. Please help us to comment this code.
 * This helps other people to understand this code better and helps them to improve it.
 * TL;DR COMMENTS ON THIS FILE ARE HIGHLY APPRECIATED
 */

/**
 * Copyright 2009 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global $, FormData, clientVars, exports, html10n */

var padimpexp = (function()
{

  ///// import
  function addImportFrames()
  {
    $("#import .importframe").remove();
    var iframe = $('<iframe style="display: none;" name="importiframe" class="importframe"></iframe>');
    $('#import').append(iframe);
  }

  function fileInputUpdated()
  {
    $('#importsubmitinput').addClass('throbbold');
    $('#importformfilediv').addClass('importformenabled');
    $('#importsubmitinput').removeAttr('disabled');
    $('#importmessagefail').fadeOut('fast');
  }

  async function fileInputSubmit(e) {
    $('#importmessagefail').fadeOut('fast');

    if (!window.confirm(html10n.get('pad.impexp.confirmimport'))) return false;

    e.preventDefault();

    $('#importsubmitinput').attr({disabled: true}).val(html10n.get('pad.impexp.importing'));
    window.setTimeout(() => $('#importfileinput').attr({disabled: true}), 0);
    $('#importarrow').stop(true, true).hide();
    $('#importstatusball').show();

    const xhr = $.ajax({
      url: window.location.href.split('?')[0].split('#')[0] + '/import',
      method: 'POST',
      data: new FormData(this),
      processData: false,
      contentType: false,
      dataType: 'json',
      timeout: 25000,
    });

    const {code, message, data: {directDatabaseAccess} = {}} = await (async () => {
      try {
        return await xhr;
      } catch (err) {
        if (err.responseJSON) return err.responseJSON;
        return {code: 2, message: 'Unknown import error'};
      }
    })();

    if (code !== 0) {
      importErrorMessage(message);
    } else {
      $('#import_export').removeClass('popup-show');
      if (directDatabaseAccess) pad.switchToPad(clientVars.padId);
    }

    $('#importsubmitinput').removeAttr('disabled').val(html10n.get('pad.impexp.importbutton'));
    window.setTimeout(() => $('#importfileinput').removeAttr('disabled'), 0);
    $('#importstatusball').hide();
    addImportFrames();
  }

  function importErrorMessage(status)
  {
    var msg="";

    if(status === "convertFailed"){
      msg = html10n.get("pad.impexp.convertFailed");
    } else if(status === "uploadFailed"){
      msg = html10n.get("pad.impexp.uploadFailed");
    } else if(status === "padHasData"){
      msg = html10n.get("pad.impexp.padHasData");
    } else if(status === "maxFileSize"){
      msg = html10n.get("pad.impexp.maxFileSize");
    } else if(status === "permission"){
      msg = html10n.get("pad.impexp.permission");
    }

    function showError(fade)
    {
      $('#importmessagefail').html('<strong style="color: red">'+html10n.get('pad.impexp.importfailed')+':</strong> ' + (msg || html10n.get('pad.impexp.copypaste','')))[(fade ? "fadeIn" : "show")]();
    }

    if ($('#importexport .importmessage').is(':visible'))
    {
      $('#importmessagesuccess').fadeOut("fast");
      $('#importmessagefail').fadeOut("fast", function()
      {
        showError(true);
      });
    }
    else
    {
      showError();
    }
  }

  ///// export

  function cantExport()
  {
    var type = $(this);
    if (type.hasClass("exporthrefpdf"))
    {
      type = "PDF";
    }
    else if (type.hasClass("exporthrefdoc"))
    {
      type = "Microsoft Word";
    }
    else if (type.hasClass("exporthrefodt"))
    {
      type = "OpenDocument";
    }
    else
    {
      type = "this file";
    }
    alert(html10n.get("pad.impexp.exportdisabled", {type:type}));
    return false;
  }

  /////
  var pad = undefined;
  var self = {
    init: function(_pad)
    {
      pad = _pad;

      //get /p/padname
      // if /p/ isn't available due to a rewrite we use the clientVars padId
      var pad_root_path = new RegExp(/.*\/p\/[^\/]+/).exec(document.location.pathname) || clientVars.padId;

      //i10l buttom import
      $('#importsubmitinput').val(html10n.get("pad.impexp.importbutton"));
      html10n.bind('localized', function() {
        $('#importsubmitinput').val(html10n.get("pad.impexp.importbutton"));
      })

      // build the export links
      $("#exporthtmla").attr("href", pad_root_path + "/export/html");
      $("#exportetherpada").attr("href", pad_root_path + "/export/etherpad");
      $("#exportplaina").attr("href", pad_root_path + "/export/txt");

      //hide stuff thats not avaible if abiword/soffice is disabled
      if(clientVars.exportAvailable == "no")
      {
        $("#exportworda").remove();
        $("#exportpdfa").remove();
        $("#exportopena").remove();

        $("#importmessageabiword").show();
      }
      else if(clientVars.exportAvailable == "withoutPDF")
      {
        $("#exportpdfa").remove();

        $("#exportworda").attr("href", pad_root_path + "/export/doc");
        $("#exportopena").attr("href", pad_root_path + "/export/odt");

        $("#importexport").css({"height":"142px"});
        $("#importexportline").css({"height":"142px"});
      }
      else
      {
        $("#exportworda").attr("href", pad_root_path + "/export/doc");
        $("#exportpdfa").attr("href", pad_root_path + "/export/pdf");
        $("#exportopena").attr("href", pad_root_path + "/export/odt");
      }

      addImportFrames();
      $("#importfileinput").change(fileInputUpdated);
      $('#importform').unbind("submit").submit(fileInputSubmit);
      $('.disabledexport').click(cantExport);
    },
    disable: function()
    {
      $("#impexp-disabled-clickcatcher").show();
      $("#import").css('opacity', 0.5);
      $("#impexp-export").css('opacity', 0.5);
    },
    enable: function()
    {
      $("#impexp-disabled-clickcatcher").hide();
      $("#import").css('opacity', 1);
      $("#impexp-export").css('opacity', 1);
    }
  };
  return self;
}());

exports.padimpexp = padimpexp;
