define([
  'jquery',
  'esri/config',
  'esri/IdentityManager',
  'esri/urlUtils',
  'esri/domUtils',
  'esri/arcgis/OAuthInfo',
  'esri/arcgis/Portal',
  'esri/arcgis/utils',
  'dojo/on',
  'app/components/vtstyleeditor',
  'app/components/itemlist',
  'app/components/notice',
  'dojo/domReady!'
], function ($, esriConfig, esriId, urlUtils, domUtils, OAuthInfo, arcgisPortal, arcgisUtils, on, VTStyleEditor, ItemList, notice) {

  var mainContainer = document.getElementById('main-container');
  var itemsNode = document.getElementById('items-container');
  var itemsList = document.getElementById('item-list');
  var actionsNode = document.getElementById('style-editor-actions');
  var noticeNode = document.getElementById('notice-container');
  var signoutBtn = document.getElementById('signout');

  domUtils.hide(mainContainer);
  domUtils.hide(actionsNode);
  domUtils.show(itemsNode);

  function initStyleEditor(portal, id) {
    styleEditor = new VTStyleEditor({
      portal: portal,
      itemid: id
    });

    styleEditor.start();

    domUtils.hide(itemsNode);
    domUtils.show(mainContainer);
    domUtils.show(actionsNode);
  }

  require(['split-pane', 'bootstrap'], function () {
    $('#main-container').splitPane();
    $('[data-toggle="popover"]').popover();
  });

//Full path to local arcgisUtils  
arcgisUtils.arcgisUrl = "https://myserver.esri.com/portal/sharing/rest/content/items"
  
  var urlObjects = urlUtils.urlToObject(location.href);

//URL to Portal's Sharing API
var portalUrl = 'myserver.esri.com/portal/sharing/rest';
   var itemid;
  if (urlObjects.query) {
    portalUrl = urlObjects.query.portal || portalUrl;
    itemid = urlObjects.query.itemid;
  }

  esriConfig.defaults.io.corsEnabledServers.push(portalUrl);

//appID for use with OAuth.  Obtained when app is registered with your Portal. 
var info = new OAuthInfo({
    appId: 'iPSr1DGTtfYy66Un',
    portalUrl: 'http://' + portalUrl,
    popup: false
  });

  var portal = new arcgisPortal.Portal(info.portalUrl);

  esriId.registerOAuthInfos([info]);

  var styleEditor;

  esriId.checkSignInStatus(info.portalUrl)
    .then(startApplication)
    .otherwise(
      function () {
        console.log('Get credentials');
        esriId.getCredential(info.portalUrl)
          .then(startApplication);
      }
    );

  on(signoutBtn, 'click', function() {
    esriId.destroyCredentials();
    window.location.reload();
  });

//URL to Portal + Web Adaptor  
var shortPortalUrl = 'myserver.esri.com/portal';
  
  function startApplication(user) {
    portal.signIn().then(function() {

      domUtils.show(signoutBtn);
      if (itemid) {
        initStyleEditor(shortPortalUrl, itemid);
      } else {
        portal.queryItems({
          //q: '(type:"Vector Tile Service", owner:"' + user.userId + '") AND NOT typekeywords:"Hosted"',
          q: 'type:"vector tiles" AND NOT typekeywords:"Hosted"',
          num: 100
        }).then(function (items) {
          if (items.results.length) {
            var list = new ItemList({ data: items.results, node: itemsList });
            list.start();

            on(itemsList, '.item-thumb:click', function (e) {
              e.preventDefault();
              var id = e.target.getAttribute('data-itemid');
              if (id) {
                initStyleEditor(shortPortalUrl, id);
              }
            });
          } else {
            // TODO - add notice
            notice(noticeNode);
            domUtils.show(noticeNode);
          }
        });
      }

    });

  }

});