```
kopia repository create s3 \
        --bucket= \
        --access-key= \
        --secret-access-key=
```

```
kopia repository connect s3 \
        --bucket= \
        --access-key= \
        --secret-access-key=
```

```
kopia policy show --global
kopia policy set {target} --snapshot-interval 1m
```

```
kopia snapshot list
```

```
kopia snapshot restore {snapshot} restore
```