strip_id <- function(path){
  tools::file_path_sans_ext(basename(path))
}
d <- do.call(rbind,
             lapply(list.files(here::here("data"), full.names=TRUE),
                    \(p) transform(read.csv(p),
                                   id = strip_id(p))))
