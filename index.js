
const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const AWS = require('aws-sdk');

try {
  const functionName = core.getInput('function-name');
  const artifact = core.getInput('artifact');
  const runTime = core.getInput('runtime');
  const handler = core.getInput('handler');
  const role = core.getInput('role');

  const AWS_SECRET_KEY = core.getInput('AWS_SECRET_KEY');
  const AWS_SECRET_ID = core.getInput('AWS_SECRET_ID');
  const AWS_REGION = core.getInput('AWS_REGION');

  console.log(`Deploying ${functionName} from ${artifact}.`);

  var zipBuffer = fs.readFileSync(`./${artifact}`);
  core.debug('ZIP file put into memory buffer.');

  const lambda = new AWS.Lambda({
      apiVersion: '2015-03-31',
      region: AWS_REGION,
      secretAccessKey: AWS_SECRET_KEY,
      accessKeyId: AWS_SECRET_ID,
      maxRetries: 3,
      sslEnabled: true,
      logger: console,
  });


  let update = false;
  lambda.getFunctionConfiguration({ FunctionName: functionName }, (err, data)  => {
    console.error(err);
    console.log(data);
    if (!err) {
      update = true
    }
  });

  if (update) {
    const params = {
      FunctionName: functionName,
      Publish: true,
      Runtime: runTime,
      Handler: handler,
      ZipFile: zipBuffer,
      Role: role,
    };
    lambda.createFunction(params, err => {
      if (err) {
          console.error(err);
          core.setFailed(err);
      }
  });
  } else {
    const params = {
      FunctionName: functionName,
      Publish: true,
      ZipFile: zipBuffer,
    };
    lambda.updateFunctionCode(params, err => {
      if (err) {
          console.error(err);
          core.setFailed(err);
      }
  });
  }
  

} catch (error) {
  core.setFailed(error.message);
}