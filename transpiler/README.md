- The backend transpiler takes in JSON output of the frontend node graph, and convert it into ETS code. This process is basically reverting how we generated templates from the OpenHarmony declarative UI interface.

- The prototype needs to support outputing `Image(xxx).xxx().foregroundFilter(xxxFilter/effect)`, an Image component with modifiers that applies visual effects on top of it. For some of the effect modifiers that requires a mask as a parameter, we also converts the `mask -> effect/filter` node graph connection into a paramter input.

Example output:
``` ts
Image("/resource/landscape.png")
    .width('100%')
    .height('100%')
    .foregroundFilter()
```