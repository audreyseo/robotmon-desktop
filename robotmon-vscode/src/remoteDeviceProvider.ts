import * as dgram from 'dgram';
import * as vscode from 'vscode';
import { RemoteDevice } from './remoteDevice';
import { Message } from './constVariables';

export class RemoteDeviceProvider implements vscode.TreeDataProvider<RemoteDevice> {

  private _onDidChangeTreeData: vscode.EventEmitter<RemoteDevice | undefined> = new vscode.EventEmitter<RemoteDevice | undefined>();
	readonly onDidChangeTreeData: vscode.Event<RemoteDevice | undefined> = this._onDidChangeTreeData.event;
  
  private mReceiver = dgram.createSocket('udp4');
  private mDevices: Array<RemoteDevice> = [];

  constructor() {
    if (vscode.workspace.rootPath === undefined) {
      vscode.window.showWarningMessage(Message.notifyOpenFolder);
    }
    this.startScanBroadcast();
  }

  public getTreeItem(element: RemoteDevice): RemoteDevice {
    return element;
  }

  public getChildren(element?: RemoteDevice): Thenable<RemoteDevice[]> {
    if (element === undefined) {
      return Promise.resolve(this.mDevices);
    }
    return Promise.resolve([]);
  }

  public clear() {
    vscode.Disposable.from(...this.mDevices).dispose();
    this.mDevices = [];
  }

  public refresh() {
    this._onDidChangeTreeData.fire();
  }

  private startScanBroadcast() {
    this.mReceiver.bind(8082);
    this.mReceiver.on('message', (msg, info) => {
      if (msg.toString() === 'robotmon') {
        this.addDevice(info.address);
      }
    }); 
  }

  private stopScanBroadcast() {
    this.mReceiver.close();
  }

  public addDevice(ip: string, port: string = "8080") {
    let isExist = false;
    for (let device of this.mDevices) {
      if (ip === device.ip) {
        isExist = true;
      }
    }
    if (!isExist) {
      let r = new RemoteDevice(ip, port);
      this.mDevices.push(r);
      this._onDidChangeTreeData.fire();
    }
  }

  public dispose() {
    this.stopScanBroadcast();
    vscode.Disposable.from(...this.mDevices).dispose();
  }

}