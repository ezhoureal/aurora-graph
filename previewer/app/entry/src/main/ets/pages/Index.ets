@Entry
@Component
struct Index {
  build() {
    Column() {
      Text('Aurora Graph Previewer')
        .fontSize(24)
        .fontWeight(FontWeight.Medium)

      Text('Edit previewer/main.ets and run npm run preview:unsigned')
        .fontSize(14)
        .opacity(0.7)
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(24)
  }
}
