# fastify-starter

Run `npm install` to install dependencies, then `npm start` to start the server.

## Protobuf Support

Build protos with `bash build.sh`.

You can use them like this:

```js
import { create, toBinary, toJson, fromBinary } from "@bufbuild/protobuf";
import { GeoPoseSchema } from "./lib/msgs/protos/geopose_pb.ts";

const geoPoseMessage = create(GeoPoseSchema, {
  latitude: 37.7749,
  longitude: -122.4194,
  altitude: 30.0,
});

console.info("GeoPose Message:", geoPoseMessage);
```
