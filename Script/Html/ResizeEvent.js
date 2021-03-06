/*
API:
    AttachParentChangedEvent(element, callback);
    DetachParentChangedEvent(element, callback);
    AttachResizeEvent(element, callback);
    DetachResizeEvent(element, callback);
*/

Packages.Define("Html.ResizeEvent", ["Html.Events"], function (__injection__) {
    eval(__injection__);

    var windowLoaded = false;
    var accumulatedParentChangedEvents = [];

    window.addEventListener("load", function (event) {
        windowLoaded = true;
        for (var i = 0; i < accumulatedParentChangedEvents.length; i++) {
            accumulatedParentChangedEvents[i]();
        }
        accumulatedParentChangedEvents = [];
    }, false);

    function AttachParentChangedEvent(element, callback) {
        AttachGeneralEvent(element, "ParentChanged", callback, function (RaiseEvent) {

            function Filter(record) {
                for (var i = 0; i < record.addedNodes.length; i++) {
                    if (record.addedNodes[i] === element) {
                        return true;
                    }
                }
                for (var i = 0; i < record.removedNodes.length; i++) {
                    if (record.removedNodes[i] === element) {
                        return true;
                    }
                }
                return false;
            }

            var observer = new MutationObserver(function (records) {
                if (records.filter(Filter).length > 0) {
                    if (windowLoaded === true) {
                        RaiseEvent();
                    }
                    else {
                        if (accumulatedParentChangedEvents.indexOf(callback) === -1) {
                            accumulatedParentChangedEvents.push(callback);
                        }
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            element.gacjs_BodySubTreeObserver = observer;
        });
    }

    function DetachParentChangedEvent(element, callback) {
        if (windowLoaded === false) {
            var index = accumulatedParentChangedEvents.indexOf(callback);
            if (index !== -1) {
                accumulatedParentChangedEvents.splice(index, 1);
            }
        }

        DetachGeneralEvent(element, "ParentChanged", callback, function (RaiseEvent) {
            element.gacjs_BodySubTreeObserver.disconnect();
            delete element.gacjs_BodySubTreeObserver;
        });
    }

    // This function is enhanced and modified to my coding style from
    // https://github.com/marcj/css-element-queries/
    function AttachResizeEvent(element, callback) {
        AttachGeneralEvent(element, "Resize", callback, function (RaiseEvent) {

            function SetStyle(element, forContainer) {
                element.style.position = "absolute";
                element.style.left = "0";
                element.style.top = "0";

                if (forContainer) {
                    element.style.right = "0";
                    element.style.bottom = "0";
                    element.style.overflow = "scroll";
                    element.style.zIndex = "-1";
                    element.style.visibility = "hidden";
                }
                else {
                    element.style.width = "200%";
                    element.style.height = "200%";
                }

            }

            var expand = document.createElement("div");
            SetStyle(expand, true);

            var expandChild = document.createElement("div");
            SetStyle(expandChild, false);

            var shrink = document.createElement("div");
            SetStyle(shrink, true);

            var shrinkChild = document.createElement("div");
            SetStyle(shrinkChild, false);

            expand.appendChild(expandChild);
            shrink.appendChild(shrinkChild);

            element.appendChild(expand);
            element.appendChild(shrink);

            element.gacjs_ResizeExpand = expand;
            element.gacjs_ResizeShrink = shrink;

            var lastWidth = null;
            var lastHeight = null;

            function Reset() {
                expandChild.style.width = expand.offsetWidth + 10 + "px";
                expandChild.style.height = expand.offsetHeight + 10 + "px";
                expand.scrollLeft = expand.scrollWidth;
                expand.scrollTop = expand.scrollHeight;
                shrink.scrollLeft = shrink.scrollWidth;
                shrink.scrollTop = shrink.scrollHeight;
                lastWidth = element.offsetWidth;
                lastHeight = element.offsetHeight;
            }

            Reset();

            expand.addEventListener("scroll", function (event) {
                if (element.offsetWidth > lastWidth || element.offsetHeight > lastHeight) {
                    RaiseEvent();
                }
                Reset();
            }, false);

            shrink.addEventListener("scroll", function (event) {
                if (element.offsetWidth < lastWidth || element.offsetHeight < lastHeight) {
                    RaiseEvent();
                }
                Reset();
            }, false);
        });
    }

    function DetachResizeEvent(element, callback) {
        DetachGeneralEvent(element, "Resize", callback, function (RaiseEvent) {
            element.removeChild(element.gacjs_ResizeExpand);
            element.removeChild(element.gacjs_ResizeShrink);
            delete element.gacjs_ResizeExpand;
            delete element.gacjs_ResizeShrink;
        });
    }

    return {
        AttachParentChangedEvent: AttachParentChangedEvent,
        DetachParentChangedEvent: DetachParentChangedEvent,
        AttachResizeEvent: AttachResizeEvent,
        DetachResizeEvent: DetachResizeEvent,
    }
});