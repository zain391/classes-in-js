
function getValueFromData(data, attributeName) {
    const dataObj = data.find(element => element.dataKey.name == attributeName);
    return (dataObj) && (dataObj.data) && (dataObj.data[0]) ? dataObj.data[0][1] : "";
}

function getDeviceId(selfCtx) {
    //This is to avoid error while running in widget bundle context (and not dashboard)
    if (!selfCtx.stateController) return;
    
    const entityId = selfCtx.stateController.getEntityId();
    if (entityId) {
        return entityId['id'];
    }
    else {
        return null;
    }
}