importCode("C:/Users/MUNEEB/Downloads/Archive/uploads/bank_system.cpp")

cpg.method.filter(_.filename != "<empty>").map(m => Map(
  "name" -> m.name,
  "code" -> m.code,
  "filename" -> m.filename,
  "lineNumber" -> m.lineNumber.getOrElse(-1),
  "lineNumberEnd" -> m.lineNumberEnd.getOrElse(-1)
)).toJson #> "C:/Users/MUNEEB/Downloads/Archive/functions.json"

exit
